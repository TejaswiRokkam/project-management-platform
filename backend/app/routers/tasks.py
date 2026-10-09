from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_project_for_user, get_task_for_user
from ..models import Project, Task, User
from ..schemas import Priority, Status, TaskCreate, TaskOut, TaskUpdate

router = APIRouter(tags=["Tasks"])


def check_assignee(project: Project, assignee_id: int | None):
    """Tasks can only be assigned to people who are members of the project."""
    if assignee_id is not None and assignee_id not in {m.id for m in project.members}:
        raise HTTPException(status_code=400, detail="Assignee must be a project member")


@router.get("/projects/{project_id}/tasks", response_model=list[TaskOut])
def list_tasks(
    project_id: int,
    search: str | None = Query(None, description="Matches title or description"),
    status: Status | None = None,
    priority: Priority | None = None,
    assignee_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_project_for_user(project_id, db, user)
    query = select(Task).where(Task.project_id == project_id)
    if search:
        like = f"%{search}%"
        query = query.where(or_(Task.title.ilike(like), Task.description.ilike(like)))
    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    if assignee_id:
        query = query.where(Task.assignee_id == assignee_id)
    return db.scalars(query.order_by(Task.id)).all()


@router.post("/projects/{project_id}/tasks", response_model=TaskOut, status_code=201)
def create_task(project_id: int, data: TaskCreate, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    project = get_project_for_user(project_id, db, user)
    check_assignee(project, data.assignee_id)
    task = Task(project_id=project_id, **data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/tasks/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_task_for_user(task_id, db, user)


@router.put("/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    task = get_task_for_user(task_id, db, user)
    changes = data.model_dump(exclude_unset=True)  # only fields the client actually sent
    if "assignee_id" in changes:
        check_assignee(task.project, changes["assignee_id"])
    for field, value in changes.items():
        if value is None and field in ("title", "status", "priority", "description"):
            continue  # these can't be cleared
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = get_task_for_user(task_id, db, user)
    db.delete(task)
    db.commit()
