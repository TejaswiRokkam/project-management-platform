from tests.conftest import register_and_login


def test_create_and_list_projects(client, auth, project):
    assert project["name"] == "Website"
    assert len(project["members"]) == 1
    res = client.get("/projects", headers=auth)
    assert [p["name"] for p in res.json()] == ["Website"]


def test_outsider_cannot_see_project(client, project):
    other = register_and_login(client, "Eve", "eve@example.com")
    assert client.get(f"/projects/{project['id']}", headers=other).status_code == 404
    assert client.get("/projects", headers=other).json() == []


def test_add_member_and_non_owner_cannot_delete(client, auth, project):
    other = register_and_login(client, "Bob", "bob@example.com")
    res = client.post(f"/projects/{project['id']}/members", json={"email": "bob@example.com"}, headers=auth)
    assert res.status_code == 200 and len(res.json()["members"]) == 2

    assert client.delete(f"/projects/{project['id']}", headers=other).status_code == 403
    assert client.delete(f"/projects/{project['id']}", headers=auth).status_code == 204


def test_add_unknown_member(client, auth, project):
    res = client.post(f"/projects/{project['id']}/members", json={"email": "ghost@example.com"}, headers=auth)
    assert res.status_code == 404
