"""Explicit retrieval -> context -> structured Gemini answer -> verified citations."""

import json
import re

from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

from app.config import Settings
from app.models import ChatRequest, ChatResponse
from app.rag.citations import build_evidence
from app.rag.errors import RagError, provider_error
from app.rag.prompts import INSUFFICIENT_CONTEXT, SYSTEM_PROMPT
from app.rag.retriever import retrieve
from app.rag.tracing import tracing_span


class GroundedAnswer(BaseModel):
    answerable: bool = Field(
        description="True only if the portfolio evidence supports an answer."
    )
    answer: str = Field(
        min_length=1,
        max_length=6000,
        description="Concise plain text answer based only on the evidence.",
    )
    source_ids: list[str] = Field(
        description="Exact chunk IDs used as evidence; empty when answerable is false."
    )


def answer_question(question: str, settings: Settings) -> ChatResponse:
    question = ChatRequest(question=question).question
    with tracing_span(
        settings,
        "portfolio.chat",
        inputs={"question": question},
        metadata={
            "chat_model": settings.chat_model,
            "embedding_model": settings.embedding_model,
        },
    ) as run:
        response = _answer_question(question, settings)
        if run:
            response.trace_id = str(run.id)
            run.end(
                outputs=response.model_dump(exclude_none=True),
                metadata={"content_hash": response.content_hash},
            )
        return response


def _answer_question(question: str, settings: Settings) -> ChatResponse:
    manifest, hits = retrieve(question, settings)
    if not hits:
        return ChatResponse(
            answer=INSUFFICIENT_CONTEXT,
            citations=[],
            content_hash=manifest.content_hash,
        )
    evidence = [
        {
            "chunk_id": hit.document.id,
            "title": hit.document.metadata["title"],
            "section": hit.document.metadata["section"],
            "text": hit.document.page_content,
        }
        for hit in hits
    ]
    model = ChatGoogleGenerativeAI(
        model=settings.chat_model,
        google_api_key=settings.gemini_api_key,
        vertexai=False,
        temperature=0,
        max_output_tokens=settings.max_output_tokens,
        timeout=settings.provider_timeout_seconds,
        max_retries=settings.chat_max_attempts,
    )
    try:
        generated = model.with_structured_output(
            GroundedAnswer, method="json_schema"
        ).invoke(
            [
                ("system", SYSTEM_PROMPT),
                (
                    "human",
                    json.dumps(
                        {"question": question, "portfolio_evidence": evidence},
                        ensure_ascii=False,
                    ),
                ),
            ],
            http_options={
                "retry_options": {
                    "attempts": settings.chat_max_attempts,
                    "initial_delay": 1.0,
                    "max_delay": 3.0,
                    "exp_base": 2.0,
                    "jitter": 0.2,
                    "http_status_codes": [500, 502, 503, 504],
                }
            },
        )
    except Exception as error:
        raise provider_error(error, "answer generation") from error
    finally:
        model.client.close()
    if not isinstance(generated, GroundedAnswer):
        raise RagError(
            "The assistant returned an invalid answer. Please try again.",
            status_code=502,
            code="invalid_answer",
        )
    if not generated.answerable:
        _, retrieved_chunks = build_evidence(hits, [])
        return ChatResponse(
            answer=INSUFFICIENT_CONTEXT,
            citations=[],
            retrieved_chunks=retrieved_chunks,
            content_hash=manifest.content_hash,
        )
    if not generated.source_ids:
        raise RagError(
            "The assistant could not verify its source citations. Please try again.",
            status_code=502,
            code="invalid_citations",
        )
    # All clickable URLs are supplied from content-derived metadata, never from the model.
    if re.search(r"https?://|www\.|<[^>]+>|\]\(", generated.answer, re.IGNORECASE):
        raise RagError(
            "The assistant returned unsupported formatting. Please try again.",
            status_code=502,
            code="invalid_answer",
        )
    citations, retrieved_chunks = build_evidence(hits, generated.source_ids)
    return ChatResponse(
        answer=generated.answer,
        citations=citations,
        retrieved_chunks=retrieved_chunks,
        content_hash=manifest.content_hash,
    )
