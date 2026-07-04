import os

# IMPORTANT: point config at the TEST database BEFORE any app module is imported,
# because app.config reads settings once at import time. Environment variables take
# precedence over the .env file in pydantic-settings, so this overrides the real DB URL.
os.environ["DATABASE_URL"] = "postgresql://ojas:ojas_dev_password@localhost:5432/ojas_test"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["GROQ_API_KEY"] = "test-groq-key"
# Force integrations "unconfigured" so tests are deterministic regardless of a local .env
# that may hold real keys. (In CI there's no .env, so these are already empty.)
os.environ["YOUTUBE_API_KEY"] = ""
os.environ["GOOGLE_CLIENT_ID"] = ""
os.environ["GOOGLE_CLIENT_SECRET"] = ""
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["S3_BUCKET"] = ""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models  # noqa: F401  — ensures every table is registered on Base.metadata
from app.database import Base, get_db
from app.main import app

engine = create_engine(os.environ["DATABASE_URL"])
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def fresh_database():
    """Drop and recreate every table before each test, so tests never affect each other."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Replace the real get_db dependency with one bound to the test database.
app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123", "name": "Test"},
    )
    response = client.post(
        "/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
