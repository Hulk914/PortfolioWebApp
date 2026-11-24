"""Request and response contracts for the initial API stub."""

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


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    trace_id: str | None = None
    trace_url: str | None = None


class IngestionResponse(BaseModel):
    status: Literal["stub"] = "stub"
    message: str
    index_updated: bool = False
