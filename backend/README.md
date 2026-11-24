# Portfolio backend

A small FastAPI application with two POST endpoints. Both return static
placeholders in this phase. No content ingestion, embeddings, vector index, LLM
calls, background jobs, or backend deployment is implemented yet.

## Run locally with uv

Use [uv](https://docs.astral.sh/uv/getting-started/installation/) to manage the
project. From the repository root:

```sh
cd backend
uv sync --locked
uv run dev
```

uv selects the Python 3.14 runtime pinned in `.python-version`, creates the local
ignored `.venv`, and installs the exact dependency versions in `uv.lock`. It can
obtain the requested Python version if one is not installed. No manual virtual
environment creation, activation, or pip command is needed. On subsequent runs,
use `uv run dev`; uv ensures the environment is synchronized automatically.

Open **http://127.0.0.1:8000/docs**, expand an endpoint, select **Try it out**, and
execute it. OpenAPI is available at `/openapi.json`. Stop the server with Ctrl+C.
The root URL `/` has no route; use `/docs` to explore the API.

The same commands work on Windows, macOS, and Linux. To run without auto-reload:

```sh
uv run start
```

You can also start from the repository root without changing directories:

```sh
uv run --project backend dev
```

## Project configuration

`pyproject.toml` holds project metadata, Python requirements, dependencies, and
console commands. The existing `app/` directory is installed as an editable
package using uv's build backend. Its commands are registered in TOML:

```toml
[project.scripts]
dev = "app.cli:dev"
start = "app.cli:start"
```

`dev` watches the application directory for Python changes; `start` runs without
the reloader. Both use the host/port from the backend settings, defaulting to
`127.0.0.1:8000`.

Use `uv add <package>` and `uv remove <package>` to change dependencies; these
update both `pyproject.toml` and `uv.lock`. Use `uv tree` to inspect dependencies
and `uv sync --locked` for a reproducible install that rejects a stale lockfile.
Commit the TOML, lockfile, and Python version pin; keep `.venv` out of Git.

## API contracts

### POST /api/chat

Request:

```json
{ "question": "What is your experience with Angular?" }
```

Current response (HTTP 200):

```json
{
  "answer": "This is a placeholder response from the portfolio API. Portfolio retrieval and LLM generation are not connected yet.",
  "citations": []
}
```

Questions are trimmed, must be nonempty, and have a 500-character limit. Invalid
requests receive FastAPI's HTTP 422 validation response. Unknown request fields
are rejected. Optional trace/citation metadata is defined for the later RAG
integration; absent metadata is omitted from the response.

### POST /api/ingest

No request body is required. Current response (HTTP 200):

```json
{
  "status": "stub",
  "message": "The ingestion endpoint is ready, but the pipeline is not connected yet. No documents or embeddings were created.",
  "index_updated": false
}
```

This response does not mean ingestion succeeded or a job was queued. The endpoint
will be connected to the shared ingestion implementation in the next phase.

To call both routes directly in PowerShell while the server runs:

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/chat' -ContentType 'application/json' -Body '{"question":"What is your experience with Angular?"}'
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/ingest'
```

## Configuration

No API keys or environment file are required for the stubs. By default CORS allows
the Angular development server at `http://127.0.0.1:4200` and
`http://localhost:4200`. Angular already targets `http://localhost:8000/api` for
local API calls; its UI does not call these endpoints yet.

To customize the host, port, or CORS, copy `.env.example` to `backend/.env` and edit
`PORTFOLIO_HOST`, `PORTFOLIO_PORT`, or `PORTFOLIO_CORS_ORIGINS` (a JSON array of origins).
This file is loaded relative to
the backend directory, independently of the shell's working directory. Restart
the server after environment changes. Origins do not contain paths such as
`/PortfolioWebApp`.

There are exactly two application endpoints in this phase. A health route and the
chatbot UI can be added when they are needed. Python 3.14 is pinned for local
development and compatibility with Vercel's currently supported Python runtimes;
the actual backend deployment remains a later phase.

## Next phases

1. Implement the ingestion pipeline over `content/portfolio.json` with a reusable
   entry point for CLI and manual API invocation.
2. Generate the local index and manifest, then connect retrieval/LLM generation to
   the chat route.
3. Add owner authorization to manual ingestion when it performs real work.
4. Add trusted CI ingestion when `content/**` changes, package the exact index
   revision with the backend, and deploy. The hosted manual fallback must trigger
   a durable index build/deployment; a Vercel function's local filesystem cannot
   replace a bundled index persistently.

Automated test suites remain deferred. Startup and direct endpoint calls are
sufficient verification for this skeleton.
