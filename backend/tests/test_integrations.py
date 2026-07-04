def test_discover_returns_stub_videos_for_mood(client, auth_headers):
    response = client.get("/discover?mood=calm", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["mood"] == "calm"
    assert len(body["videos"]) == 6
    assert all(v["is_stub"] for v in body["videos"])


def test_export_returns_pdf_when_s3_not_configured(client, auth_headers):
    response = client.post("/export", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:5] == b"%PDF-"


def test_google_authorize_reports_not_configured(client, auth_headers):
    # With no Google client credentials set, the integration returns 503.
    response = client.get("/integrations/google/authorize", headers=auth_headers)
    assert response.status_code == 503


def test_discover_requires_auth(client):
    assert client.get("/discover").status_code == 401
