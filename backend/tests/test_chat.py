import pytest
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda


def test_crisis_signal_bypasses_llm(client, auth_headers):
    # A crisis phrase must return the fixed helpline message, with crisis=True and no sources,
    # WITHOUT ever calling retrieval or the LLM (no mocking needed — the guard runs first).
    response = client.post(
        "/chat", json={"question": "I want to die"}, headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["crisis"] is True
    assert body["sources"] == []
    assert "helpline" in body["answer"].lower()


def test_grounded_answer_returns_citations(client, auth_headers, monkeypatch):
    # Mock retrieval to return known entries, and mock the LLM so no network/Groq call happens.
    monkeypatch.setattr(
        "app.rag.query_entries",
        lambda user_id, question, n_results=5: [
            {"source": "Journal", "date": "2026-07-01", "text": "Felt tired."},
            {"source": "ScreenTime", "date": "2026-07-01", "text": "6 hours."},
        ],
    )
    monkeypatch.setattr(
        "app.rag._get_llm",
        lambda: RunnableLambda(lambda _prompt_value: AIMessage(content="A grounded reply.")),
    )

    response = client.post(
        "/chat", json={"question": "Why am I tired?"}, headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["crisis"] is False
    assert body["answer"] == "A grounded reply."
    assert body["sources"] == [
        {"source": "Journal", "date": "2026-07-01"},
        {"source": "ScreenTime", "date": "2026-07-01"},
    ]


def test_chat_requires_auth(client):
    assert client.post("/chat", json={"question": "hi"}).status_code == 401
