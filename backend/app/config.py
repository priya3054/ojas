from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60

    groq_api_key: str = ""
    chroma_host: str = "localhost"
    chroma_port: int = 8001
    # Embedded mode runs ChromaDB in-process (used on Hugging Face Spaces, which is a single
    # container). Local dev keeps this False and uses the separate Chroma Docker container.
    chroma_embedded: bool = False
    chroma_path: str = "/tmp/ojas_chroma"
    # Re-index the vector store from Postgres on startup (needed on hosts with ephemeral storage).
    reindex_on_startup: bool = False

    # Comma-separated list of frontend origins allowed to call this API (CORS).
    cors_origins: str = "http://localhost:5173"
    # Where to send the browser back to after the Google OAuth callback completes.
    frontend_url: str = "http://localhost:5173"

    # YouTube Data API (Discover screen) — empty = use stub data
    youtube_api_key: str = ""

    # AWS S3 (PDF export) — empty = return the generated PDF directly instead of uploading
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-south-1"
    s3_bucket: str = ""

    # Google OAuth (Calendar sync) — empty = integration disabled, endpoints report "not configured"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/integrations/google/callback"


settings = Settings()
