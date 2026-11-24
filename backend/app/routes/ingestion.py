"""Owner-authorized manual refresh of the local Chroma index."""

import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings
from app.models import IngestionResponse
from app.rag.ingestion import ingest as run_ingestion

router = APIRouter()
owner_auth = HTTPBearer(
    auto_error=False,
    description="Owner token from PORTFOLIO_INGESTION_TOKEN. Never include this in Angular.",
)


def require_owner(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(owner_auth)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    if settings.is_hosted:
        raise HTTPException(
            status_code=409,
            detail="Hosted index updates require a new deployment. Run the 'Deploy backend to Vercel' GitHub workflow to rebuild and publish a fresh snapshot.",
        )
    expected = (
        settings.ingestion_token.get_secret_value() if settings.ingestion_token else ""
    )
    if not expected.strip():
        raise HTTPException(
            status_code=503,
            detail="Configure PORTFOLIO_INGESTION_TOKEN to enable manual ingestion.",
        )
    if credentials is None or not secrets.compare_digest(
        credentials.credentials.encode(), expected.encode()
    ):
        raise HTTPException(
            status_code=401,
            detail="A valid owner ingestion token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post(
    "/ingest",
    response_model=IngestionResponse,
    summary="Refresh the local portfolio index (owner only)",
    dependencies=[Depends(require_owner)],
)
def ingest(
    settings: Annotated[Settings, Depends(get_settings)],
    force: Annotated[
        bool, Query(description="Re-embed all chunks even if the source is unchanged.")
    ] = False,
) -> IngestionResponse:
    return run_ingestion(settings, force=force)
