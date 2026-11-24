"""Chroma snapshots and an atomically published manifest selecting the active one."""

import hashlib
import json
import os
import tempfile
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Literal

import chromadb
from chromadb.config import Settings as ChromaSettings
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.config import Settings
from app.rag.errors import RagError

PIPELINE_VERSION = "1"


class IndexManifest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: Literal[1] = 1
    pipeline_version: str = PIPELINE_VERSION
    index_id: str
    collection_name: str
    content_hash: str
    source_revision: str | None = None
    embedding_model: str
    embedding_dimensions: int
    distance_metric: Literal["cosine"] = "cosine"
    chunk_size: int
    chunk_overlap: int
    site_url: str
    document_count: int = Field(ge=1)
    chunk_count: int = Field(ge=1)
    chunk_ids_hash: str
    created_at: datetime


def index_identity(settings: Settings, content_hash: str) -> str:
    config = {
        "content_hash": content_hash,
        "pipeline_version": PIPELINE_VERSION,
        "embedding_model": settings.embedding_model,
        "dimensions": settings.embedding_dimensions,
        "chunk_size": settings.chunk_size,
        "chunk_overlap": settings.chunk_overlap,
        "site_url": settings.site_url,
    }
    return hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()


def ids_hash(ids: list[str]) -> str:
    return hashlib.sha256("\n".join(sorted(ids)).encode()).hexdigest()


@lru_cache(maxsize=4)
def chroma_client(directory: str):
    return chromadb.PersistentClient(
        path=str(Path(directory) / "chroma"),
        settings=ChromaSettings(anonymized_telemetry=False),
    )


def close_clients() -> None:
    # Chroma owns SQLite/HNSW handles; closing them also makes CI artifacts portable.
    for directory in _opened_directories:
        chroma_client(directory).close()
    chroma_client.cache_clear()
    _opened_directories.clear()


_opened_directories: set[str] = set()


def get_client(settings: Settings):
    directory = str(settings.index_dir)
    client = chroma_client(directory)
    _opened_directories.add(directory)
    return client


def read_manifest(settings: Settings) -> IndexManifest:
    try:
        return IndexManifest.model_validate_json(
            (settings.index_dir / "manifest.json").read_text(encoding="utf-8")
        )
    except (OSError, ValueError, ValidationError) as error:
        raise RagError(
            "No usable portfolio index was found. Run 'uv run ingest' or POST /api/ingest first.",
            code="missing_index",
        ) from error


def check_compatibility(
    manifest: IndexManifest, settings: Settings, content_hash: str
) -> None:
    if manifest.index_id != index_identity(settings, content_hash):
        raise RagError(
            "The portfolio content or index configuration changed. Run ingestion before asking questions.",
            code="stale_index",
        )


def get_collection(settings: Settings, manifest: IndexManifest):
    if not (settings.index_dir / "chroma" / "chroma.sqlite3").is_file():
        raise RagError(
            "The Chroma database is missing. Run ingestion first.", code="missing_index"
        )
    try:
        return get_client(settings).get_collection(
            manifest.collection_name, embedding_function=None
        )
    except Exception as error:
        raise RagError(
            "The active Chroma collection could not be opened. Run ingestion again.",
            code="invalid_index",
        ) from error


def validate_index(settings: Settings, manifest: IndexManifest) -> None:
    collection = get_collection(settings, manifest)
    rows = collection.get(include=[])
    if (
        collection.count() != manifest.chunk_count
        or ids_hash(rows["ids"]) != manifest.chunk_ids_hash
    ):
        raise RagError(
            "The Chroma index is incomplete. Run ingestion again.", code="invalid_index"
        )
    sample = collection.get(ids=rows["ids"][:1], include=["embeddings"])
    vectors = sample["embeddings"]
    if vectors is None or len(vectors[0]) != manifest.embedding_dimensions:
        raise RagError(
            "The Chroma vector dimensions do not match the manifest. Run ingestion again.",
            code="invalid_index",
        )


def publish_manifest(settings: Settings, manifest: IndexManifest) -> None:
    temporary_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=settings.index_dir,
            suffix=".tmp",
            delete=False,
        ) as output:
            temporary_path = output.name
            output.write(manifest.model_dump_json(indent=2) + "\n")
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary_path, settings.index_dir / "manifest.json")
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.unlink(temporary_path)
