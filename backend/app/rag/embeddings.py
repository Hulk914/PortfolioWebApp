"""Explicit Gemini document/query embeddings; Chroma never downloads a model."""

import math

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import Settings
from app.rag.errors import RagError, provider_error
from app.rag.tracing import tracing_span


def embedding_client(settings: Settings) -> GoogleGenerativeAIEmbeddings:
    if (
        not settings.gemini_api_key
        or not settings.gemini_api_key.get_secret_value().strip()
    ):
        raise RagError(
            "Set GOOGLE_API_KEY (or GEMINI_API_KEY) in backend/.env before ingestion or chat.",
            code="missing_api_key",
        )
    return GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model,
        google_api_key=settings.gemini_api_key,
        vertexai=False,
        output_dimensionality=settings.embedding_dimensions,
        client_args={"timeout": settings.provider_timeout_seconds},
    )


def validate_vectors(vectors: list[list[float]], count: int, dimensions: int) -> None:
    if len(vectors) != count or any(
        len(vector) != dimensions
        or not all(math.isfinite(value) for value in vector)
        or not any(value != 0 for value in vector)
        for vector in vectors
    ):
        raise RagError(
            "The embedding provider returned missing or incompatible vectors. The active index was preserved.",
            status_code=502,
            code="invalid_embeddings",
        )


def embed_documents(texts: list[str], settings: Settings) -> list[list[float]]:
    with tracing_span(
        settings,
        "gemini.embed_documents",
        run_type="embedding",
        inputs={"texts": texts},
        metadata={
            "ls_provider": "google_genai",
            "ls_model_name": settings.embedding_model,
        },
    ) as run:
        vectors = _embed_documents(texts, settings)
        if run:
            run.end(
                outputs={
                    "embedding_count": len(vectors),
                    "dimensions": settings.embedding_dimensions,
                }
            )
        return vectors


def _embed_documents(texts: list[str], settings: Settings) -> list[list[float]]:
    model = embedding_client(settings)
    try:
        vectors = model.embed_documents(
            texts,
            batch_size=settings.embedding_batch_size,
            task_type="RETRIEVAL_DOCUMENT",
        )
        validate_vectors(vectors, len(texts), settings.embedding_dimensions)
        return vectors
    except RagError:
        raise
    except Exception as error:
        raise provider_error(error, "document embedding") from error
    finally:
        model.client.close()


def embed_query(question: str, settings: Settings) -> list[float]:
    with tracing_span(
        settings,
        "gemini.embed_query",
        run_type="embedding",
        inputs={"query": question},
        metadata={
            "ls_provider": "google_genai",
            "ls_model_name": settings.embedding_model,
        },
    ) as run:
        vector = _embed_query(question, settings)
        if run:
            run.end(
                outputs={
                    "embedding_count": 1,
                    "dimensions": settings.embedding_dimensions,
                }
            )
        return vector


def _embed_query(question: str, settings: Settings) -> list[float]:
    model = embedding_client(settings)
    try:
        vector = model.embed_query(question, task_type="RETRIEVAL_QUERY")
        validate_vectors([vector], 1, settings.embedding_dimensions)
        return vector
    except RagError:
        raise
    except Exception as error:
        raise provider_error(error, "query embedding") from error
    finally:
        model.client.close()
