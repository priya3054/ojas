# Ojas — Deployment Guide

This walks through putting Ojas online. Order matters: **GitHub first** (everything deploys from it),
then the **frontend** (easy), then the **backend** (the involved part).

---

## 0. Prerequisites you already have
- A GitHub account.
- The accounts from earlier phases (Groq, Google Cloud, optionally AWS).

## 1. Push the code to GitHub
Deployment platforms build from a GitHub repo, and the CI workflow (`.github/workflows/ci.yml`) runs there.
1. On github.com create a **new empty repository** named `ojas` (no README/gitignore — we already have them).
2. From the project folder:
   ```bash
   git add .
   git commit -m "Ojas: full-stack AI wellness app"
   git branch -M main
   git remote add origin https://github.com/<you>/ojas.git
   git push -u origin main
   ```
3. On the repo's **Actions** tab you'll see the CI workflow run (backend pytest + frontend build). Green = good.

**Safety check before pushing:** confirm secrets aren't committed — `git status` should NOT list
`backend/.env`. It's gitignored, so it won't be. Only `.env.example` files (placeholders) get pushed.

## 2. Deploy the frontend (Vercel) — the easy win
1. Go to vercel.com, sign in **with GitHub**, click **Add New → Project**, import the `ojas` repo.
2. Set **Root Directory** to `frontend`. Vercel auto-detects Vite (build `npm run build`, output `dist`).
3. Add an **Environment Variable**: `VITE_API_URL` = your backend URL (from step 3 — you can deploy the
   frontend first with a placeholder and update it after the backend is live).
4. **Deploy.** You get a URL like `https://ojas.vercel.app`. `vercel.json` handles SPA routing so deep
   links (e.g. `/dashboard`) work on refresh.

## 3. Deploy the backend (Railway) — the involved part
**Honest heads-up:** the backend is heavy — it bundles PyTorch + Hugging Face (the local sentiment model)
and talks to ChromaDB, so the image is ~2 GB and needs **more than the 512 MB** free tiers like Render give
(it will out-of-memory). **Railway** is the pragmatic choice: usage-based with trial credit and enough RAM.
It builds straight from our `backend/Dockerfile`.

1. Go to railway.app, sign in with GitHub, **New Project → Deploy from GitHub repo** → pick `ojas`.
2. Railway detects `backend/Dockerfile`. Set the service's **root directory** to `backend`.
3. **Add a database:** in the project, **New → Database → PostgreSQL**. Railway gives it a `DATABASE_URL` —
   reference it from the API service (Railway lets services share variables).
4. **Add ChromaDB:** **New → Empty Service → Deploy from Docker image** `chromadb/chroma:latest`, expose
   its port. Set the API service's `CHROMA_HOST` to that service's internal hostname and `CHROMA_PORT=8000`.
5. **Set the API service's variables** (from `backend/.env.example`):
   `DATABASE_URL` (from the PG service), `SECRET_KEY` (a long random string), `GROQ_API_KEY`,
   `CHROMA_HOST`/`CHROMA_PORT`, `CORS_ORIGINS` = your Vercel URL (e.g. `https://ojas.vercel.app`),
   and the optional `YOUTUBE_API_KEY` / `GOOGLE_*` / `AWS_*` if you want those live.
6. The container runs `alembic upgrade head` on start (see the Dockerfile `CMD`), so the DB tables are
   created automatically on first deploy.
7. Railway gives the API a public URL. Put that into Vercel's `VITE_API_URL` and redeploy the frontend.
8. Update `GOOGLE_REDIRECT_URI` (and the Google Cloud console's authorized redirect URI) to the deployed
   backend URL if you're using Calendar in production.

## 4. Verify end-to-end
- Open the Vercel URL, register/log in, click through the screens.
- If API calls fail with a CORS error in the browser console, double-check `CORS_ORIGINS` on the backend
  exactly matches the Vercel origin (scheme + host, no trailing slash).

## Cost note
- **Vercel** frontend: free hobby tier is plenty.
- **Railway** backend + Postgres + Chroma: uses trial credit, then usage-based (a few dollars/month at
  idle). If you only need it live for a demo/interview, spin it up when needed and pause it after.
- A lighter-weight alternative (future optimization): drop the local PyTorch sentiment model in favor of a
  hosted sentiment API, which would shrink the image enough to fit smaller/free tiers.
