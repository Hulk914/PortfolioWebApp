"""Small uv commands for ingestion, retrieval inspection, and local questions."""

import argparse
import json
import sys
from collections.abc import Callable

from pydantic import ValidationError

from app.config import get_settings
from app.rag.errors import RagError
from app.rag.store import close_clients
from app.rag.tracing import flush_traces


def _run(action: Callable[[], dict]) -> None:
    try:
        print(json.dumps(action(), ensure_ascii=False, indent=2, default=str))
    except RagError as error:
        print(f"{error.code}: {error}", file=sys.stderr)
        raise SystemExit(1) from None
    except ValidationError:
        print(
            "Invalid configuration or question. Check backend/.env; questions must contain 1–500 characters.",
            file=sys.stderr,
        )
        raise SystemExit(1) from None
    finally:
        flush_traces(close=True)
        close_clients()


def ingest() -> None:
    parser = argparse.ArgumentParser(
        description="Refresh Chroma from shared portfolio content."
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-embed everything instead of reusing unchanged chunks.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate/extract/split only; no keys, model calls, or database writes.",
    )
    args = parser.parse_args()

    def action() -> dict:
        from app.rag.ingestion import ingest as run_ingestion, prepare_chunks

        settings = get_settings()
        if not args.dry_run:
            return run_ingestion(settings, force=args.force).model_dump()
        content_hash, documents, chunks = prepare_chunks(settings)
        return {
            "status": "dry_run",
            "content_hash": content_hash,
            "document_count": len(documents),
            "chunk_count": len(chunks),
            "embedding_model": settings.embedding_model,
            "embedding_dimensions": settings.embedding_dimensions,
            "documents": [
                {
                    "document_id": doc.metadata["document_id"],
                    "section": doc.metadata["section"],
                    "source_url": doc.metadata["source_url"],
                }
                for doc in documents
            ],
        }

    _run(action)


def ask() -> None:
    parser = argparse.ArgumentParser(
        description="Ask a grounded portfolio question through the same pipeline as POST /api/chat."
    )
    parser.add_argument("question")
    args = parser.parse_args()

    def action() -> dict:
        from app.rag.chain import answer_question

        return answer_question(args.question, get_settings()).model_dump(
            exclude_none=True
        )

    _run(action)


def retrieve() -> None:
    parser = argparse.ArgumentParser(
        description="Inspect retrieved context without calling the chat model (query embeddings still use Gemini)."
    )
    parser.add_argument("question")
    args = parser.parse_args()

    def action() -> dict:
        from app.models import ChatRequest
        from app.rag.retriever import retrieve as run_retrieval

        manifest, hits = run_retrieval(
            ChatRequest(question=args.question).question, get_settings()
        )
        return {
            "content_hash": manifest.content_hash,
            "chunks": [
                {
                    "chunk_id": hit.document.id,
                    "score": hit.score,
                    "metadata": hit.document.metadata,
                    "text": hit.document.page_content,
                }
                for hit in hits
            ],
        }

    _run(action)


def inspect_index() -> None:
    def action() -> dict:
        from app.rag.loader import content_snapshot
        from app.rag.store import check_compatibility, read_manifest, validate_index

        settings = get_settings()
        manifest = read_manifest(settings)
        check_compatibility(manifest, settings, content_snapshot(settings)[1])
        validate_index(settings, manifest)
        return manifest.model_dump(mode="json")

    _run(action)
