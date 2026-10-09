# Taskboard: Project Management Platform

A full-stack Kanban app. Teams create projects, add members, and move tasks across To Do / In Progress / Done, with priorities, deadlines, assignees, search and filters.

**Stack:** React + Vite + Tailwind · FastAPI + Pydantic · PostgreSQL + SQLAlchemy · JWT auth (bcrypt) · Pytest

## Run it locally

You need Python 3.11+, Node 18+, and Docker (only for the database).

### 1. Database
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
uvicorn app.main:app --reload
```
API: http://localhost:8000 · Swagger docs: http://localhost:8000/docs
Tables are created automatically on first start.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:5173

### 4. Tests
```bash
cd backend
pytest
```
Tests use an in-memory SQLite database, so they don't touch your real data.

> No Docker? Set `DATABASE_URL=sqlite:///./dev.db` in `backend/.env` and skip step 1.

## Project layout
```
backend/app/
  main.py        app setup, CORS, routers
  config.py      settings from .env
  database.py    engine + session
  models.py      tables (User, Project, Task, project_members)
  schemas.py     Pydantic request/response shapes
  security.py    bcrypt hashing + JWT
  deps.py        get_current_user + permission checks
  routers/       auth.py, projects.py, tasks.py
backend/tests/   pytest + TestClient

frontend/src/
  api.js          every backend call, in one place
  AuthContext.jsx login state shared across the app
  App.jsx         routes + <Protected> wrapper
  pages/          Login, Register, Dashboard, ProjectBoard
  components/     Navbar, TaskCard, TaskModal
```

## API summary
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT (form fields `username` = email, `password`) |
| GET | `/auth/me` | Current user |
| GET/POST | `/projects` | List mine / create |
| GET/PUT/DELETE | `/projects/{id}` | Read / rename / delete (owner only for edit and delete) |
| POST | `/projects/{id}/members` | Add a member by email (owner) |
| GET | `/projects/{id}/tasks?search=&status=&priority=&assignee_id=` | List and filter |
| POST | `/projects/{id}/tasks` | Create task |
| GET/PUT/DELETE | `/tasks/{id}` | Read / update (partial) / delete |

## How the pieces fit (read in this order)
1. `models.py`: the data and its relationships.
2. `schemas.py`: what the API accepts and returns.
3. `routers/auth.py` + `security.py` + `deps.py`: how login and "who is this?" works.
4. `routers/tasks.py`: filtering and partial updates.
5. `frontend/src/api.js` then `ProjectBoard.jsx`: how React talks to the API and renders the board.

## Ideas to extend it
- Alembic migrations instead of `create_all`
- Task comments (a new `Comment` table, one-to-many from Task)
- Reorder cards within a column (add a `position` column)
- Refresh tokens, or httpOnly cookies instead of localStorage
- Deploy: Render/Railway (backend + Postgres) and Vercel/Netlify (frontend)
- GitHub Actions workflow that runs `pytest` on every push
