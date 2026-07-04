# Start from a slim official Python image (Debian-based, minimal extras).
FROM python:3.12-slim

# All following commands run inside /app in the image's filesystem.
WORKDIR /app

# Install dependencies FIRST (before copying the rest of the code) so Docker can
# cache this layer — rebuilds skip re-installing packages unless requirements.txt changes.
COPY requirements.txt .
# Install the CPU-only torch build explicitly (same reason as on the host: the default
# PyPI wheel bundles large GPU/CUDA libraries we don't need), then everything else.
# --timeout/--retries make the large torch download resilient to slow/flaky networks.
RUN pip install --no-cache-dir --timeout 300 --retries 10 torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir --timeout 300 --retries 10 -r requirements.txt

# Cache dir for Hugging Face model downloads — set to a writable path (works on HF Spaces too).
ENV HF_HOME=/tmp/hf_cache

# Pre-download the sentiment model at build time so it's baked into the image.
# This makes container cold-starts fast (no ~330MB download on first request).
RUN python -c "from transformers import pipeline; pipeline('text-classification', model='j-hartmann/emotion-english-distilroberta-base', top_k=None)"

# Now copy the application source into the image.
COPY . .

# On container start: apply DB migrations, then launch the API.
# PORT defaults to 8000 locally; Hugging Face Spaces set it to 7860.
# 0.0.0.0 = listen on all interfaces so it's reachable from outside the container.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
