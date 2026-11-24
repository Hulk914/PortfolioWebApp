"""Split within document boundaries, retaining source metadata on every chunk."""

import hashlib

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import Settings


def chunk_documents(documents: list[Document], settings: Settings) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks: list[Document] = []
    for document in documents:
        metadata = document.metadata
        heading = (
            f"{metadata['owner']} | {metadata['title']} | {metadata['content_type']}"
        )
        if metadata.get("technologies"):
            heading += f"\nTechnologies: {metadata['technologies']}"
        for position, part in enumerate(splitter.split_text(document.page_content)):
            text = f"{heading}\n\n{part}"
            source = (
                f"{metadata['document_id']}:{metadata['section']}:{position}:{text}"
            )
            chunk_id = hashlib.sha256(source.encode()).hexdigest()
            chunks.append(
                Document(
                    id=chunk_id,
                    page_content=text,
                    metadata={
                        **metadata,
                        "chunk_id": chunk_id,
                        "chunk_index": position,
                        "text_hash": hashlib.sha256(text.encode()).hexdigest(),
                    },
                )
            )
    return chunks
