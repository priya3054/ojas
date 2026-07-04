import pytest


@pytest.fixture(autouse=True)
def stub_external_services(monkeypatch):
    """Replace the heavy sentiment model and the Chroma indexing call with fast fakes.

    We patch the names as imported INTO app.routers.journal (that's where they're used),
    not where they're originally defined.
    """
    monkeypatch.setattr(
        "app.routers.journal.analyze_sentiment",
        lambda text: {"sentiment_score": 0.5, "mood_label": "good", "emotion_tags": ["joy"]},
    )
    monkeypatch.setattr("app.routers.journal.index_entry", lambda **kwargs: None)


def test_create_journal_entry_attaches_sentiment(client, auth_headers):
    response = client.post(
        "/journal", json={"content": "A calm and pleasant day."}, headers=auth_headers
    )
    assert response.status_code == 201
    body = response.json()
    assert body["content"] == "A calm and pleasant day."
    assert body["sentiment_score"] == 0.5
    assert body["mood_label"] == "good"
    assert body["emotion_tags"] == ["joy"]


def test_list_returns_own_entries(client, auth_headers):
    client.post("/journal", json={"content": "First."}, headers=auth_headers)
    client.post("/journal", json={"content": "Second."}, headers=auth_headers)
    response = client.get("/journal", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_journal_requires_auth(client):
    assert client.post("/journal", json={"content": "x"}).status_code == 401
