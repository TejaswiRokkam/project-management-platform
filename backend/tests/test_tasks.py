from tests.conftest import register_and_login


def make_task(client, auth, project, **overrides):
    body = {"title": "Write copy", **overrides}
    res = client.post(f"/projects/{project['id']}/tasks", json=body, headers=auth)
    assert res.status_code == 201, res.text
    return res.json()


def test_create_task_defaults(client, auth, project):
    task = make_task(client, auth, project)
    assert task["status"] == "todo" and task["priority"] == "medium"


def test_update_status_moves_card(client, auth, project):
    task = make_task(client, auth, project)
    res = client.put(f"/tasks/{task['id']}", json={"status": "in_progress"}, headers=auth)
    assert res.json()["status"] == "in_progress"
    assert res.json()["title"] == "Write copy"  # untouched fields stay as they were


def test_invalid_status_rejected(client, auth, project):
    task = make_task(client, auth, project)
    assert client.put(f"/tasks/{task['id']}", json={"status": "banana"}, headers=auth).status_code == 422


def test_assign_and_unassign(client, auth, project):
    me = client.get("/auth/me", headers=auth).json()
    task = make_task(client, auth, project, assignee_id=me["id"])
    assert task["assignee"]["name"] == "Alice"
    res = client.put(f"/tasks/{task['id']}", json={"assignee_id": None}, headers=auth)
    assert res.json()["assignee"] is None


def test_cannot_assign_non_member(client, auth, project):
    bob = register_and_login(client, "Bob", "bob@example.com")
    bob_id = client.get("/auth/me", headers=bob).json()["id"]
    res = client.post(f"/projects/{project['id']}/tasks", json={"title": "x", "assignee_id": bob_id}, headers=auth)
    assert res.status_code == 400


def test_search_and_filters(client, auth, project):
    make_task(client, auth, project, title="Fix login bug", priority="high")
    make_task(client, auth, project, title="Write docs", priority="low", status="done")
    url = f"/projects/{project['id']}/tasks"

    assert len(client.get(url, params={"search": "login"}, headers=auth).json()) == 1
    assert len(client.get(url, params={"priority": "low"}, headers=auth).json()) == 1
    assert len(client.get(url, params={"status": "done"}, headers=auth).json()) == 1
    assert len(client.get(url, headers=auth).json()) == 2


def test_delete_task(client, auth, project):
    task = make_task(client, auth, project)
    assert client.delete(f"/tasks/{task['id']}", headers=auth).status_code == 204
    assert client.get(f"/tasks/{task['id']}", headers=auth).status_code == 404


def test_outsider_cannot_touch_task(client, auth, project):
    task = make_task(client, auth, project)
    eve = register_and_login(client, "Eve", "eve@example.com")
    assert client.put(f"/tasks/{task['id']}", json={"title": "hacked"}, headers=eve).status_code == 404
    assert client.delete(f"/tasks/{task['id']}", headers=eve).status_code == 404


def test_project_progress_counts(client, auth, project):
    make_task(client, auth, project)
    make_task(client, auth, project, status="done")
    res = client.get(f"/projects/{project['id']}", headers=auth).json()
    assert res["task_count"] == 2 and res["done_count"] == 1
