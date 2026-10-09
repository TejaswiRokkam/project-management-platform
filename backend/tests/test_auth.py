from tests.conftest import register_and_login


def test_register_and_login(client):
    res = client.post("/auth/register", json={"name": "Bob", "email": "bob@example.com", "password": "secret123"})
    assert res.status_code == 201
    assert "password" not in res.json() and "hashed_password" not in res.json()

    res = client.post("/auth/login", data={"username": "bob@example.com", "password": "secret123"})
    assert res.status_code == 200
    assert res.json()["token_type"] == "bearer"


def test_duplicate_email_rejected(client):
    body = {"name": "Bob", "email": "bob@example.com", "password": "secret123"}
    client.post("/auth/register", json=body)
    assert client.post("/auth/register", json=body).status_code == 400


def test_wrong_password(client):
    client.post("/auth/register", json={"name": "Bob", "email": "bob@example.com", "password": "secret123"})
    res = client.post("/auth/login", data={"username": "bob@example.com", "password": "nope-nope"})
    assert res.status_code == 401


def test_short_password_rejected(client):
    res = client.post("/auth/register", json={"name": "Bob", "email": "bob@example.com", "password": "123"})
    assert res.status_code == 422


def test_protected_routes_need_token(client):
    assert client.get("/projects").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_me(client, auth):
    res = client.get("/auth/me", headers=auth)
    assert res.json()["email"] == "alice@example.com"
