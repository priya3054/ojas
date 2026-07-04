def test_register_returns_user_without_password(client):
    response = client.post(
        "/auth/register",
        json={"email": "a@example.com", "password": "secret123", "name": "Ann"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "a@example.com"
    assert body["name"] == "Ann"
    assert "password" not in body
    assert "hashed_password" not in body


def test_duplicate_email_rejected(client):
    payload = {"email": "dup@example.com", "password": "secret123", "name": "Dup"}
    client.post("/auth/register", json=payload)
    second = client.post("/auth/register", json=payload)
    assert second.status_code == 400


def test_login_and_access_protected_route(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


def test_protected_route_requires_token(client):
    assert client.get("/auth/me").status_code == 401


def test_wrong_password_rejected(client):
    client.post(
        "/auth/register",
        json={"email": "w@example.com", "password": "correct123", "name": "W"},
    )
    response = client.post(
        "/auth/login", data={"username": "w@example.com", "password": "wrong"}
    )
    assert response.status_code == 401
