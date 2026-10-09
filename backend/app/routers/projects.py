from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_project_for_user
from ..models import Project, User
from ..schemas import MemberAdd, ProjectCreate, ProjectDetail, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["Projects"])


def require_owner(project: Project, user: User):
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can do this")


@router.get("", response_model=list[ProjectOut])
def list_projects(user: User = Depends(get_current_user)):
    return sorted(user.projects, key=lambda p: p.created_at, reverse=True)


@router.post("", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = Project(name=data.name.strip(), description=data.description, owner_id=user.id, members=[user])
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_project_for_user(project_id, db, user)


@router.put("/{project_id}", response_model=ProjectDetail)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    project = get_project_for_user(project_id, db, user)
    require_owner(project, user)
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_for_user(project_id, db, user)
    require_owner(project, user)
    db.delete(project)
    db.commit()


@router.post("/{project_id}/members", response_model=ProjectDetail)
def add_member(project_id: int, data: MemberAdd, db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    project = get_project_for_user(project_id, db, user)
    require_owner(project, user)
    new_member = db.scalar(select(User).where(User.email == data.email.lower()))
    if new_member is None:
        raise HTTPException(status_code=404, detail="No user with that email. Ask them to register first.")
    if new_member in project.members:
        raise HTTPException(status_code=400, detail="Already a member")
    project.members.append(new_member)
    db.commit()
    db.refresh(project)
    return project
