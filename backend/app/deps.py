"""Reusable dependencies: who is logged in, and can they access this project/task?"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import Project, Task, User
from .security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    user_id = decode_access_token(token)
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_project_for_user(project_id: int, db: Session, user: User) -> Project:
    """Returns the project only if the user is a member. We answer 404 (not 403)
    so outsiders can't learn which project ids exist."""
    project = db.get(Project, project_id)
    if project is None or user not in project.members:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def get_task_for_user(task_id: int, db: Session, user: User) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    get_project_for_user(task.project_id, db, user)
    return task
