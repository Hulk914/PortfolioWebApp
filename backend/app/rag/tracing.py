"""Optional private LangSmith spans with explicit inputs; never trace Settings/secrets."""

import logging
from contextlib import ExitStack, contextmanager
from functools import lru_cache

from langsmith import Client, trace, tracing_context
from pydantic import SecretStr

from app.config import Settings

logger = logging.getLogger(__name__)
_clients: list[Client] = []


def _tracing_error(error: Exception) -> None:
    logger.warning(
        "Private LangSmith tracing failed (%s); the RAG request can continue.",
        type(error).__name__,
    )


@lru_cache(maxsize=1)
def _client(api_key: SecretStr, endpoint: str, workspace_id: str | None) -> Client:
    client = Client(
        api_key=api_key.get_secret_value(),
        api_url=endpoint,
        workspace_id=workspace_id or None,
        timeout_ms=(3000, 7000),
        tracing_error_callback=_tracing_error,
    )
    _clients.append(client)
    return client


def tracing_client(settings: Settings) -> Client | None:
    if not settings.langsmith_tracing:
        return None
    if (
        not settings.langsmith_api_key
        or not settings.langsmith_api_key.get_secret_value().strip()
    ):
        logger.warning(
            "Tracing is enabled but LANGSMITH_API_KEY/LANGCHAIN_API_KEY is missing."
        )
        return None
    return _client(
        settings.langsmith_api_key,
        settings.langsmith_endpoint,
        settings.langsmith_workspace_id,
    )


@contextmanager
def tracing_span(
    settings: Settings,
    name: str,
    *,
    run_type: str = "chain",
    inputs: dict | None = None,
    metadata: dict | None = None,
):
    # Programmatic context also controls automatic LangChain LLM child spans.
    # No global dotenv export is needed, and no private trace is made public.
    with ExitStack() as stack:
        try:
            client = tracing_client(settings)
            stack.enter_context(
                tracing_context(
                    enabled=client is not None,
                    client=client,
                    project_name=settings.langsmith_project,
                )
            )
            run = (
                stack.enter_context(
                    trace(
                        name,
                        run_type=run_type,
                        inputs=inputs or {},
                        metadata=metadata or {},
                        client=client,
                        project_name=settings.langsmith_project,
                    )
                )
                if client
                else None
            )
        except Exception as error:
            _tracing_error(error)
            stack.close()
            stack.enter_context(tracing_context(enabled=False))
            run = None
        yield run


def flush_traces(*, close: bool = False) -> None:
    for client in _clients:
        try:
            client.close(timeout=5) if close else client.flush(timeout=5)
        except Exception as error:
            _tracing_error(error)
    if close:
        _clients.clear()
        _client.cache_clear()
