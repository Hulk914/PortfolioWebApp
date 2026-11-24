"""Compatibility entry point: uv run python scripts/ingest.py [--dry-run|--force]."""

from app.rag.cli import ingest

if __name__ == "__main__":
    ingest()
