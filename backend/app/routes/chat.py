"""Portfolio questions answered through Chroma retrieval and Gemini."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.models import ChatRequest, ChatResponse
from app.rag.chain import answer_question

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    response_model_exclude_none=True,
    summary="Ask a grounded portfolio question",
)
def chat(
    request: ChatRequest, settings: Annotated[Settings, Depends(get_settings)]
) -> ChatResponse:
    return answer_question(request.question, settings)
