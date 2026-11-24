"""Manual ingestion endpoint; no pipeline or index writes are implemented yet."""

from fastapi import APIRouter

from app.models import IngestionResponse

router = APIRouter()


@router.post(
    "/ingest",
    response_model=IngestionResponse,
    summary="Run manual ingestion (stub)",
)
async def ingest() -> IngestionResponse:
    """Return a placeholder without creating chunks, embeddings, or an index."""
    return IngestionResponse(
        message=(
            "The ingestion endpoint is ready, but the pipeline is not connected yet. "
            "No documents or embeddings were created."
        ),
    )
