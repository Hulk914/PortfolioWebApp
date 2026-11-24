"""FastAPI entry point for local development and snapshot-based Vercel deployment."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.config import get_settings
from app.rag.errors import RagError
from app.rag.store import close_clients
from app.rag.runtime import initialize_runtime
from app.rag.tracing import flush_traces
from app.routes import chat, health, ingestion

settings = get_settings()
initialize_runtime(settings)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    flush_traces(close=True)
    close_clients()


app = FastAPI(
    title="Portfolio Recruiter API",
    version="0.2.0",
    lifespan=lifespan,
    description=(
        "Portfolio RAG using Gemini and a local persistent Chroma database. "
        "Chat uses a prebuilt index; owner ingestion refreshes it from shared content."
    ),
)


@app.exception_handler(RagError)
async def handle_rag_error(request: Request, error: RagError):
    return JSONResponse(
        status_code=error.status_code,
        content={"detail": str(error), "code": error.code},
        headers={"Retry-After": "5"} if error.code == "provider_unavailable" else None,
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, error: Exception):
    # Do not echo provider exceptions, filesystem paths, credentials, or prompts.
    return JSONResponse(
        status_code=500,
        content={
            "detail": "The portfolio service could not complete this request. Please try again.",
            "code": "internal_error",
        },
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    expose_headers=["Retry-After"],
)

app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(ingestion.router, prefix="/api", tags=["Ingestion"])
app.include_router(health.router, prefix="/api", tags=["Readiness"])


@app.get("/", include_in_schema=False)
def api_documentation():
    return RedirectResponse("/docs")
