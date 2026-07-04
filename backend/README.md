---
title: Ojas API
emoji: 🌿
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Ojas — Backend API

FastAPI backend for the Ojas AI wellness platform: journaling + mood (Hugging Face sentiment),
medicine adherence, habits, screen time, cycle tracking, and a RAG assistant
(LangChain + ChromaDB + Groq/Llama 3.3) that answers questions grounded in the user's own logged data.

This Space runs the API as a Docker container. Configure it via the following **Settings → Variables and
secrets**:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | A Postgres connection string (e.g. a free Neon database) |
| `SECRET_KEY` | Long random string for signing JWTs |
| `GROQ_API_KEY` | Groq API key (RAG chat) |
| `CHROMA_EMBEDDED` | `true` — run ChromaDB in-process |
| `REINDEX_ON_STARTUP` | `true` — rebuild the vector store from Postgres on boot |
| `PORT` | `7860` |
| `CORS_ORIGINS` | Your frontend URL, e.g. `https://your-app.vercel.app` |
| `YOUTUBE_API_KEY`, `GOOGLE_*`, `AWS_*` | Optional integrations |

The frontend lives separately (deployed on Vercel). See the main project repo for the full app.
