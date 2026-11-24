"""CLI entry point: uv run python scripts/query.py "Your portfolio question"."""

from app.rag.cli import ask

if __name__ == "__main__":
    ask()
