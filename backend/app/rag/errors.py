"""Safe, actionable errors shared by CLI commands and HTTP routes."""

import logging

logger = logging.getLogger(__name__)


class RagError(Exception):
    def __init__(
        self, message: str, *, status_code: int = 503, code: str = "rag_unavailable"
    ):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


def provider_error(error: Exception, operation: str) -> RagError:
    """Inspect wrapped SDK errors without exposing prompts, credentials, or URLs."""
    logger.warning("%s failed (%s)", operation, type(error).__name__)
    current: BaseException | None = error
    seen: set[int] = set()
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        status = getattr(current, "code", None) or getattr(current, "status_code", None)
        if status == 429:
            return RagError(
                "Gemini quota is exhausted. Please try again later.",
                status_code=429,
                code="provider_quota",
            )
        if status in (401, 403):
            return RagError(
                "Gemini credentials or model access need attention in the backend configuration.",
                code="provider_credentials",
            )
        if status in (500, 502, 503, 504):
            return RagError(
                "Gemini is temporarily unavailable or busy. Please try again shortly.",
                status_code=503,
                code="provider_unavailable",
            )
        if (
            isinstance(current, TimeoutError)
            or "timeout" in type(current).__name__.lower()
        ):
            return RagError(
                "Gemini took too long to respond. Please try again.",
                status_code=504,
                code="provider_timeout",
            )
        current = current.__cause__ or current.__context__
    return RagError(
        f"Gemini could not complete {operation}. Please try again or check the configured model and API access.",
        status_code=502,
        code="provider_error",
    )
