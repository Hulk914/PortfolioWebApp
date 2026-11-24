"""Local environment configuration shared by API routes."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        env_prefix="PORTFOLIO_",
        extra="ignore",
    )

    host: str = "127.0.0.1"
    port: int = Field(default=8000, ge=1, le=65535)
    cors_origins: list[str] = [
        "http://127.0.0.1:4200",
        "http://localhost:4200",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
