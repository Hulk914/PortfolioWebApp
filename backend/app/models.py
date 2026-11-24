"""Public request/response contracts for portfolio chat and owner ingestion."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    question: str = Field(
        min_length=1,
        max_length=500,
        description="A recruiter question about the portfolio.",
        examples=["What is your experience with Angular?"],
    )


class Citation(BaseModel):
    document_id: str
    title: str
    url: str
    section: str | None = None
    chunk_ids: list[str] = Field(
        default_factory=list,
        description="IDs of supporting chunks in this response's retrieved_chunks.",
    )


class EvidenceChunk(BaseModel):
    chunk_id: str
    document_id: str
    title: str
    section: str
    text: str = Field(
        description="Exact indexed text retrieved from Chroma and supplied to Gemini."
    )
    similarity_score: float = Field(
        ge=-1, le=1, description="Cosine similarity; not a confidence probability."
    )
    used_in_answer: bool = Field(
        default=False,
        description="Whether Gemini cited this retrieved chunk in its answer.",
    )
    source_file: str
    url: str = Field(
        description="Public portfolio page or section corresponding to the local source document."
    )


class ChatResponse(BaseModel):
    status: Literal["answered", "insufficient_context"] = Field(
        default="answered",
        description="Distinguishes grounded answers from valid questions the portfolio cannot answer.",
    )
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    retrieved_chunks: list[EvidenceChunk] = Field(
        default_factory=list,
        description="The retrieved context supplied to Gemini, including chunks it did not cite.",
    )
    trace_id: str | None = None
    trace_url: str | None = None
    content_hash: str


class IngestionResponse(BaseModel):
    status: Literal["completed", "unchanged"]
    message: str
    index_updated: bool
    content_hash: str
    index_id: str
    document_count: int
    chunk_count: int
    embedded_chunks: int
    reused_chunks: int
