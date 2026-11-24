"""Embed the question and retrieve the nearest chunks from the published index."""

from dataclasses import dataclass

from langchain_core.documents import Document

from app.config import Settings
from app.rag.embeddings import embed_query
from app.rag.errors import RagError
from app.rag.loader import content_snapshot
from app.rag.store import (
    IndexManifest,
    check_compatibility,
    get_collection,
    read_manifest,
)
from app.rag.tracing import tracing_span


@dataclass(frozen=True)
class RetrievedChunk:
    document: Document
    score: float


def retrieve(
    question: str, settings: Settings
) -> tuple[IndexManifest, list[RetrievedChunk]]:
    with tracing_span(
        settings,
        "chroma.retrieve",
        run_type="retriever",
        inputs={"query": question},
        metadata={
            "top_k": settings.retrieval_top_k,
            "min_score": settings.retrieval_min_score,
        },
    ) as run:
        manifest, hits = _retrieve(question, settings)
        if run:
            run.end(
                outputs={
                    "documents": [
                        {
                            "chunk_id": hit.document.id,
                            "text": hit.document.page_content,
                            "score": hit.score,
                            "metadata": hit.document.metadata,
                        }
                        for hit in hits
                    ]
                },
                metadata={
                    "content_hash": manifest.content_hash,
                    "index_id": manifest.index_id,
                },
            )
        return manifest, hits


def _retrieve(
    question: str, settings: Settings
) -> tuple[IndexManifest, list[RetrievedChunk]]:
    manifest = read_manifest(settings)
    check_compatibility(manifest, settings, content_snapshot(settings)[1])
    collection = get_collection(settings, manifest)
    if collection.count() != manifest.chunk_count:
        raise RagError(
            "The active index is incomplete. Run ingestion again.", code="invalid_index"
        )
    vector = embed_query(question, settings)
    try:
        result = collection.query(
            query_embeddings=[vector],
            n_results=min(settings.retrieval_top_k, manifest.chunk_count),
            include=["documents", "metadatas", "distances"],
        )
    except Exception as error:
        raise RagError(
            "Portfolio retrieval failed. Check the local index or rebuild it.",
            code="retrieval_failed",
        ) from error
    hits: list[RetrievedChunk] = []
    for chunk_id, text, metadata, distance in zip(
        result["ids"][0],
        result["documents"][0],
        result["metadatas"][0],
        result["distances"][0],
        strict=True,
    ):
        score = max(-1.0, min(1.0, 1.0 - distance))
        if score >= settings.retrieval_min_score and text and metadata:
            hits.append(
                RetrievedChunk(
                    document=Document(
                        id=chunk_id, page_content=text, metadata=metadata
                    ),
                    score=score,
                )
            )
    return manifest, hits
