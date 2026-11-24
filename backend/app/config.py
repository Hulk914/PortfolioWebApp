"""Backend and RAG configuration; paths are relative to the backend directory."""

from functools import lru_cache
import os
import tempfile
from pathlib import Path
from typing import Literal

from pydantic import AliasChoices, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        env_prefix="PORTFOLIO_",
        extra="ignore",
    )

    host: str = "127.0.0.1"
    runtime: Literal["local", "vercel"] = "local"
    port: int = Field(default=8000, ge=1, le=65535)
    cors_origins: list[str] = [
        "http://127.0.0.1:4200",
        "http://localhost:4200",
    ]
    gemini_api_key: SecretStr | None = Field(
        default=None, validation_alias=AliasChoices("GOOGLE_API_KEY", "GEMINI_API_KEY")
    )
    chat_model: str = Field(
        default="gemini-3.5-flash-lite", validation_alias="GEMINI_CHAT_MODEL"
    )
    embedding_model: str = Field(
        default="gemini-embedding-001", validation_alias="GEMINI_EMBEDDING_MODEL"
    )
    embedding_dimensions: int = Field(default=768, ge=128, le=3072)
    embedding_batch_size: int = Field(default=32, ge=1, le=100)
    content_dir: Path = Path("../content")
    index_dir: Path = Path("data/generated-index")
    site_url: str = "https://hulk914.github.io/PortfolioWebApp/"
    chunk_size: int = Field(default=1200, ge=300, le=6000)
    chunk_overlap: int = Field(default=150, ge=0)
    retrieval_top_k: int = Field(default=6, ge=1, le=12)
    retrieval_min_score: float = Field(default=0.3, ge=-1, le=1)
    provider_timeout_seconds: float = Field(default=30, ge=1, le=120)
    chat_max_attempts: int = Field(default=3, ge=1, le=3)
    max_output_tokens: int = Field(default=1200, ge=128, le=4096)
    ingestion_token: SecretStr | None = None
    langsmith_tracing: bool = Field(
        default=False,
        validation_alias=AliasChoices(
            "LANGSMITH_TRACING", "LANGCHAIN_TRACING_V2", "LANGCHAIN_TRACING"
        ),
    )
    langsmith_api_key: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices("LANGSMITH_API_KEY", "LANGCHAIN_API_KEY"),
    )
    langsmith_project: str = Field(
        default="portfolio-rag",
        validation_alias=AliasChoices("LANGSMITH_PROJECT", "LANGCHAIN_PROJECT"),
    )
    langsmith_endpoint: str = Field(
        default="https://api.smith.langchain.com",
        validation_alias=AliasChoices("LANGSMITH_ENDPOINT", "LANGCHAIN_ENDPOINT"),
    )
    langsmith_workspace_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "LANGSMITH_WORKSPACE_ID", "LANGCHAIN_WORKSPACE_ID"
        ),
    )

    @property
    def is_hosted(self) -> bool:
        return self.runtime == "vercel" or os.environ.get("VERCEL") == "1"

    @model_validator(mode="after")
    def validate_rag_settings(self) -> "Settings":
        from urllib.parse import urlsplit

        if self.chunk_overlap >= self.chunk_size:
            raise ValueError(
                "PORTFOLIO_CHUNK_OVERLAP must be smaller than PORTFOLIO_CHUNK_SIZE."
            )
        site = urlsplit(self.site_url)
        if (
            site.scheme not in {"http", "https"}
            or not site.netloc
            or site.query
            or site.fragment
            or site.username
        ):
            raise ValueError(
                "PORTFOLIO_SITE_URL must be an absolute HTTP(S) base URL without credentials, query, or fragment."
            )
        self.site_url = self.site_url.rstrip("/") + "/"
        self.content_dir = (BACKEND_DIR / self.content_dir).resolve()
        self.index_dir = (BACKEND_DIR / self.index_dir).resolve()
        if self.is_hosted:
            # Local .env paths must never select a writable directory in the bundle.
            self.content_dir = BACKEND_DIR / "data" / "release" / "content"
            self.index_dir = Path(tempfile.gettempdir()) / "portfolio-chroma"
            origin = f"{site.scheme}://{site.netloc}"
            self.cors_origins = list(dict.fromkeys([*self.cors_origins, origin]))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
