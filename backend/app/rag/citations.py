"""Build inspectable evidence from Chroma hits, preserving each cited chunk."""

from app.models import Citation, EvidenceChunk
from app.rag.errors import RagError
from app.rag.retriever import RetrievedChunk


def build_evidence(
    hits: list[RetrievedChunk], source_ids: list[str]
) -> tuple[list[Citation], list[EvidenceChunk]]:
    sources = {hit.document.id for hit in hits}
    if any(source_id not in sources for source_id in source_ids):
        raise RagError(
            "The assistant could not verify its source citations. Please try again.",
            status_code=502,
            code="invalid_citations",
        )
    cited_ids = set(source_ids)
    chunks = [
        EvidenceChunk(
            chunk_id=hit.document.id,
            document_id=hit.document.metadata["document_id"],
            title=hit.document.metadata["title"],
            section=hit.document.metadata["section"],
            text=hit.document.page_content,
            similarity_score=hit.score,
            used_in_answer=hit.document.id in cited_ids,
            source_file=hit.document.metadata["source_file"],
            url=hit.document.metadata["source_url"],
        )
        for hit in hits
    ]
    by_chunk_id = {chunk.chunk_id: chunk for chunk in chunks}
    by_document: dict[str, Citation] = {}
    for source_id in dict.fromkeys(source_ids):
        chunk = by_chunk_id[source_id]
        if chunk.document_id not in by_document:
            by_document[chunk.document_id] = Citation(
                document_id=chunk.document_id,
                title=chunk.title,
                url=chunk.url,
                section=chunk.section,
                chunk_ids=[],
            )
        by_document[chunk.document_id].chunk_ids.append(source_id)
    return list(by_document.values()), chunks
