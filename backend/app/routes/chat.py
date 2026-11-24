"""Chat endpoint; portfolio retrieval and model generation are a later phase."""

from fastapi import APIRouter

from app.models import ChatRequest, ChatResponse

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    response_model_exclude_none=True,
    summary="Ask a portfolio question (stub)",
)
async def chat(request: ChatRequest) -> ChatResponse:
    """Validate the question and return a static response without calling an LLM."""
    return ChatResponse(
        answer=(
            "This is a placeholder response from the portfolio API. "
            "Portfolio retrieval and LLM generation are not connected yet."
        ),
    )
