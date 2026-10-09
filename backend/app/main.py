from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (makes sure tables are registered)
from .config import CORS_ORIGINS
from .database import Base, engine
from .routers import auth, projects, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # creates tables on first run
    yield


app = FastAPI(
    title="Project Management API",
    description="Projects, tasks and a Kanban workflow. Try it out below: register, log in, then click **Authorize**.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "docs": "/docs"}
