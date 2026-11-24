"""Console commands registered in pyproject.toml and run through uv."""

from pathlib import Path

import uvicorn

from app.config import get_settings


def dev() -> None:
    """Run the local API with reloads limited to the application directory."""
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        reload_dirs=[str(Path(__file__).resolve().parent)],
    )


def start() -> None:
    """Run the API without the development reloader."""
    settings = get_settings()
    uvicorn.run("app.main:app", host=settings.host, port=settings.port)
