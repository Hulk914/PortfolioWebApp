"""One ingestion implementation shared by the CLI, manual API, and GitHub Actions."""

import os
from datetime import datetime, timezone
from uuid import uuid4

from filelock import FileLock, Timeout

from app.config import Settings
from app.models import IngestionResponse
from app.rag.chunker import chunk_documents
from app.rag.embeddings import embed_documents, validate_vectors
from app.rag.errors import RagError
from app.rag.loader import content_snapshot, load_documents
from app.rag.store import (
    IndexManifest,
    check_compatibility,
    get_client,
    get_collection,
    ids_hash,
    index_identity,
    publish_manifest,
    read_manifest,
    validate_index,
)
from app.rag.tracing import tracing_span


def prepare_chunks(settings: Settings):
    content, content_hash = content_snapshot(settings)
    documents = load_documents(settings, content)
    chunks = chunk_documents(documents, settings)
    if not chunks:
        raise RagError(
            "Portfolio content did not produce any chunks.",
            status_code=422,
            code="empty_content",
        )
    return content_hash, documents, chunks


def ingest(settings: Settings, *, force: bool = False) -> IngestionResponse:
    with tracing_span(
        settings,
        "portfolio.ingest",
        inputs={"source": "content/portfolio.json", "force": force},
        metadata={"embedding_model": settings.embedding_model},
    ) as run:
        result = _ingest(settings, force=force)
        if run:
            run.end(
                outputs=result.model_dump(),
                metadata={
                    "content_hash": result.content_hash,
                    "index_id": result.index_id,
                },
            )
        return result


def _ingest(settings: Settings, *, force: bool) -> IngestionResponse:
    try:
        settings.index_dir.mkdir(parents=True, exist_ok=True)
        with FileLock(settings.index_dir / "ingest.lock", timeout=0):
            return _ingest_locked(settings, force=force)
    except Timeout as error:
        raise RagError(
            "Another ingestion is running. Please wait for it to finish.",
            status_code=409,
            code="ingestion_busy",
        ) from error
    except OSError as error:
        raise RagError(
            "Cannot write the local index. Check PORTFOLIO_INDEX_DIR and filesystem permissions.",
            code="index_write_failed",
        ) from error


def _ingest_locked(settings: Settings, *, force: bool) -> IngestionResponse:
    content_hash, documents, chunks = prepare_chunks(settings)
    previous = None
    try:
        previous = read_manifest(settings)
        if not force:
            check_compatibility(previous, settings, content_hash)
            validate_index(settings, previous)
            if (
                os.environ.get("GITHUB_SHA")
                and previous.source_revision != os.environ["GITHUB_SHA"]
            ):
                previous.source_revision = os.environ["GITHUB_SHA"]
                publish_manifest(settings, previous)
            return IngestionResponse(
                status="unchanged",
                message="The index already matches the current portfolio and configuration.",
                index_updated=False,
                content_hash=content_hash,
                index_id=previous.index_id,
                document_count=previous.document_count,
                chunk_count=previous.chunk_count,
                embedded_chunks=0,
                reused_chunks=previous.chunk_count,
            )
    except RagError:
        pass

    # Reuse only compatible, byte-identical chunks from the previous published snapshot.
    vectors: dict[str, list[float]] = {}
    if (
        not force
        and previous
        and previous.embedding_model == settings.embedding_model
        and previous.embedding_dimensions == settings.embedding_dimensions
    ):
        try:
            old = get_collection(settings, previous).get(
                ids=[chunk.id for chunk in chunks], include=["embeddings", "metadatas"]
            )
            if old["embeddings"] is not None:
                for chunk_id, vector, metadata in zip(
                    old["ids"], old["embeddings"], old["metadatas"], strict=True
                ):
                    if metadata and metadata.get("chunk_id") == chunk_id:
                        values = vector.tolist()
                        validate_vectors([values], 1, settings.embedding_dimensions)
                        vectors[chunk_id] = values
        except Exception:
            vectors.clear()
    reused_count = len(vectors)
    missing = [chunk for chunk in chunks if chunk.id not in vectors]
    if missing:
        fresh = embed_documents([chunk.page_content for chunk in missing], settings)
        vectors.update(
            {chunk.id: vector for chunk, vector in zip(missing, fresh, strict=True)}
        )

    # Detect content edits during a provider call; never label an old snapshot as current.
    if content_snapshot(settings)[1] != content_hash:
        raise RagError(
            "Portfolio content changed during ingestion. Run it again.",
            status_code=409,
            code="content_changed",
        )
    client = get_client(settings)
    collection_name = (
        f"portfolio-{index_identity(settings, content_hash)[:16]}-{uuid4().hex[:8]}"
    )
    collection = client.create_collection(
        name=collection_name,
        embedding_function=None,
        configuration={"hnsw": {"space": "cosine"}},
        metadata={"content_hash": content_hash},
    )
    try:
        batch_size = min(100, client.get_max_batch_size())
        for offset in range(0, len(chunks), batch_size):
            batch = chunks[offset : offset + batch_size]
            collection.upsert(
                ids=[chunk.id for chunk in batch],
                documents=[chunk.page_content for chunk in batch],
                metadatas=[chunk.metadata for chunk in batch],
                embeddings=[vectors[chunk.id] for chunk in batch],
            )
        manifest = IndexManifest(
            index_id=index_identity(settings, content_hash),
            collection_name=collection_name,
            content_hash=content_hash,
            source_revision=os.environ.get("GITHUB_SHA"),
            embedding_model=settings.embedding_model,
            embedding_dimensions=settings.embedding_dimensions,
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            site_url=settings.site_url,
            document_count=len(documents),
            chunk_count=len(chunks),
            chunk_ids_hash=ids_hash([chunk.id for chunk in chunks]),
            created_at=datetime.now(timezone.utc),
        )
        validate_index(settings, manifest)
        publish_manifest(settings, manifest)
    except Exception:
        client.delete_collection(collection_name)
        raise
    return IngestionResponse(
        status="completed",
        message="Published a fresh portfolio index.",
        index_updated=True,
        content_hash=content_hash,
        index_id=manifest.index_id,
        document_count=len(documents),
        chunk_count=len(chunks),
        embedded_chunks=len(missing),
        reused_chunks=reused_count,
    )
