"""Pydantic schemas: what the API accepts (input) and returns (output)."""
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Status = Literal["todo", "in_progress", "done"]
Priority = Literal["low", "medium", "high"]


# ---------- Users / auth ----------
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Projects ----------
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = ""


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    owner_id: int
    created_at: datetime
    task_count: int
    done_count: int


class ProjectDetail(ProjectOut):
    members: list[UserOut]


class MemberAdd(BaseModel):
    email: EmailStr


# ---------- Tasks ----------
class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    status: Status = "todo"
    priority: Priority = "medium"
    due_date: date | None = None
    assignee_id: int | None = None


class TaskUpdate(BaseModel):
    """Every field optional so the client can send only what changed."""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: Status | None = None
    priority: Priority | None = None
    due_date: date | None = None
    assignee_id: int | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    title: str
    description: str
    status: Status
    priority: Priority
    due_date: date | None
    assignee_id: int | None
    assignee: UserOut | None
    created_at: datetime
