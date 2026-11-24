"""FastAPI entry point for local development and later Vercel deployment."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import chat, ingestion

settings = get_settings()

app = FastAPI(
    title="Portfolio Recruiter API",
    version="0.1.0",
    description=(
        "Initial local API skeleton. Chat and ingestion return static placeholder "
        "responses; RAG, embeddings, and model calls will be connected later."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(ingestion.router, prefix="/api", tags=["Ingestion"])
