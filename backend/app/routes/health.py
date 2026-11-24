"""Readiness and public revision metadata; no model calls or ingestion."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.rag.loader import content_snapshot
from app.rag.store import check_compatibility, read_manifest, validate_index

router = APIRouter()


@router.get("/health", summary="Check the loaded index and content revision")
def health(settings: Annotated[Settings, Depends(get_settings)]) -> dict:
    manifest = read_manifest(settings)
    check_compatibility(manifest, settings, content_snapshot(settings)[1])
    validate_index(settings, manifest)
    return {
        "status": "ok",
        "rag_index_loaded": True,
        "content_hash": manifest.content_hash,
        "index_id": manifest.index_id,
        "source_revision": manifest.source_revision or "local",
        "embedding_model": manifest.embedding_model,
        "embedding_dimensions": manifest.embedding_dimensions,
        "chunk_count": manifest.chunk_count,
    }
