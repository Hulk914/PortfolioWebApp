# Portfolio backend

FastAPI + Gemini + a local persistent Chroma database. The two APIs now run the
complete backend flow. GitHub Actions prepares and deploys an immutable backend
snapshot to Vercel. The Angular chatbot UI remains a separate phase.

## Local setup

From the repository root:

```sh
cd backend
uv sync --locked
```

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`), then set:

```dotenv
GOOGLE_API_KEY=your-private-Google-AI-Studio-key
PORTFOLIO_INGESTION_TOKEN=your-private-random-owner-token
```

Get your Gemini key from [Google AI Studio](https://aistudio.google.com/api-keys).
Keep it in your ignored local `.env`; never put either secret in Angular or Git.
Generate an owner token with `uv run python -c "import secrets; print(secrets.token_urlsafe(32))"`.
The owner token is needed for the manual API, not local CLI commands.

```sh
uv run ingest --dry-run
uv run ingest
uv run dev
```

The first command validates/extracts/splits without keys, API calls, or database
writes. The second embeds and persists the index. The third starts the API at
**http://127.0.0.1:8000/docs**. Subsequent starts only need `uv run dev`.
`uv run start` disables reload. From the repository root,
`uv run --project backend ingest` and `uv run --project backend dev` also work.
Python 3.14 and `.venv` are managed by uv.

At `/docs`, use **Authorize** with your owner token before calling `/api/ingest`.
Chat needs no owner token. No database build occurs on startup or chat requests.

## CLI commands

Run these from `backend/`:

```sh
uv run ingest                         # create or incrementally refresh the index
uv run ingest --force                 # explicitly re-embed every chunk
uv run ingest --dry-run               # inspect document/chunk counts and sources
uv run inspect-index                  # verify the manifest and local Chroma data
uv run retrieve "Which projects use Angular?"  # print scores/context, no chat call
uv run ask "What is Ayush's experience in financial services?"
```

`retrieve` still calls Gemini for the query embedding. `ask` uses the exact same
pipeline as the chat API. Script entry points are also available:
`uv run python scripts/ingest.py` and
`uv run python scripts/query.py "Your question"`.

## POST /api/ingest

Owner-only, no request body. Provide `Authorization: Bearer <your-owner-token>`.
Use `?force=true` only when you want to regenerate all embeddings.
This endpoint updates the local database. On Vercel it returns HTTP 409 with
directions to run the GitHub deployment workflow; instance storage is temporary.

```powershell
$ownerToken = Read-Host 'Owner ingestion token'
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/ingest' -Headers @{ Authorization = "Bearer $ownerToken" }
```

Response shape (counts/hashes depend on content):

```json
{
  "status": "completed",
  "message": "Published a fresh portfolio index.",
  "index_updated": true,
  "content_hash": "sha256-of-canonical-content",
  "index_id": "sha256-of-content-and-index-configuration",
  "document_count": 34,
  "chunk_count": 35,
  "embedded_chunks": 35,
  "reused_chunks": 0
}
```

Unchanged content/configuration returns `status: "unchanged"` and
`index_updated: false`, without embedding calls. Edits reuse identical chunks;
new/changed chunks are embedded, and removed chunks are excluded from the newly
published collection. A file lock prevents concurrent CLI/API ingestion; a
second invocation returns HTTP 409. Missing owner configuration returns 503;
missing/incorrect authorization returns 401.

## POST /api/chat

```json
{ "question": "What is Ayush's experience with Angular?" }
```

PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/chat' -ContentType 'application/json' -Body '{"question":"What is Ayush''s experience with Angular?"}'
```

Successful answers contain `answer`, `citations`, `retrieved_chunks`, and
`content_hash`. The local JSON is mapped to its public portfolio pages:
project URLs use `/PortfolioWebApp/projects/<slug>` and other sources use actual
home-page anchors such as `/PortfolioWebApp/#experience`. These URLs identify
the rendered portfolio content, not the local JSON or Chroma filesystem path.

Every citation includes `document_id`, `title`, `url`, `section`, and `chunk_ids`.
The matching entries in `retrieved_chunks` contain the exact indexed `text` sent
to Gemini, `chunk_id`, `document_id`, `title`, `section`, `source_file`, `url`,
`similarity_score`, and `used_in_answer`. Text and scores come directly from the
retrieved Chroma hits; the model only selects IDs. Repeated citations to one
document retain all its cited chunk IDs instead of discarding later chunks.

This supports the planned technical evidence panel: clicking a citation can
display its chunks from the same chat response, with no additional API request.
The public URL can be a separate **View portfolio source** link. The response's
`content_hash` identifies the source snapshot even after future content edits.
The frontend interfaces are updated; the interactive panel remains UI-phase work.

`retrieved_chunks` includes all context passed to Gemini, in similarity order.
`used_in_answer: true` means the model cited that chunk; retrieved chunks it did
not cite remain available for inspection with `false`. Similarity measures
vector proximity, not answer confidence. If Gemini abstains, citations are empty
and any retrieved chunks are retained with `used_in_answer: false`; if retrieval
finds nothing above the threshold, both arrays are empty.

Example response shape (IDs, text, and score below are illustrative):

```json
{
  "answer": "A grounded answer about the documented experience.",
  "content_hash": "<content-sha256>",
  "citations": [
    {
      "document_id": "experience:fico-lead-engineer",
      "title": "Lead Engineer at FICO",
      "url": "https://hulk914.github.io/PortfolioWebApp/#experience",
      "section": "experience",
      "chunk_ids": ["<chunk-sha256>"]
    }
  ],
  "retrieved_chunks": [
    {
      "chunk_id": "<chunk-sha256>",
      "document_id": "experience:fico-lead-engineer",
      "title": "Lead Engineer at FICO",
      "section": "experience",
      "text": "Exact indexed chunk text supplied to Gemini.",
      "similarity_score": 0.78,
      "used_in_answer": true,
      "source_file": "content/portfolio.json",
      "url": "https://hulk914.github.io/PortfolioWebApp/#experience"
    }
  ]
}
```

Each request independently embeds the question, searches Chroma with cosine
similarity, filters below the configured threshold, and supplies only those
chunks to Gemini. A structured answer must name retrieved source IDs. Unsupported
questions/no relevant results return a clear insufficient-information answer with
no citations. Grounding instructions preserve caveats and distinguish learning
resources from production/employer experience. Model grounding still needs your
manual review; citations validate source identity, not every claim's correctness.

Questions are trimmed, limited to 1-500 characters, and reject unknown fields
with HTTP 422. Missing/stale indexes return 503 with instructions to ingest.
Missing credentials return 503; provider quota failures return 429. Chat retries
temporary HTTP 500/502/503/504 failures up to three total attempts with a short
exponential backoff (1-second initial delay, capped at 3 seconds). If the provider
remains unavailable, the API returns HTTP 503, `code: "provider_unavailable"`, a
clear busy message, and a `Retry-After` header. Other provider failures/timeouts
return 502/504. Errors contain a safe `detail` and `code`, not
raw provider exceptions. There is no fake fallback model or automatic re-ingestion.

## Content, chunks, and database

- `app/rag/loader.py` validates `content/portfolio.json` against its schema and
  checks duplicate IDs, project slugs/groups, and related-project references.
  It converts profile, skills, roles, project summaries/details, education, and
  personal information to LangChain documents. Presentation markup is flattened
  into text with paragraph/list boundaries; no web scraping or PDF ingestion.
- `chunker.py` applies `RecursiveCharacterTextSplitter` within those document
  boundaries. Every chunk retains stable IDs, source URL, title, section, type,
  company (where applicable), and technology tags.
- `embeddings.py` uses `RETRIEVAL_DOCUMENT` for content and `RETRIEVAL_QUERY` for
  questions, using the same configurable model/dimensions. Chroma's implicit
  embedding function is disabled; no local embedding model is downloaded.
- `ingestion.py` creates a fresh cosine Chroma collection and validates it before
  atomically replacing `manifest.json`. Failed embeddings preserve the previous
  published snapshot. Previous collections remain on disk so in-flight readers
  can finish; they are not included in active retrieval.
- `store.py` stores Chroma files under `data/generated-index/chroma/` and records
  the source hash, pipeline version, model, dimensions, chunk settings, counts,
  IDs checksum, timestamp, and CI commit revision in `manifest.json`.
- `retriever.py` checks freshness/compatibility and returns the closest chunks.
  `chain.py` supplies their context to Gemini and verifies returned citations.

All generated indexes are ignored by Git and kept out of the Angular build.
The manifest hash changes with canonical JSON content; whitespace/key reordering
alone does not require new embeddings. Configuration changes that affect indexing
require ingestion again. Bump `PIPELINE_VERSION` in `store.py` when changing
extraction/chunking behavior to invalidate old indexes.

Local Chroma is embedded: no Docker, separate database server, or paid vector DB.
It requires a writable directory, including when opening its persistent client.
To reclaim old snapshots, stop the API, remove only the generated `chroma/` and
`manifest.json` in your configured index directory, then run ingestion again.

## Configuration

`.env.example` lists every supported setting. Paths resolve from `backend/`,
independently of the shell's current directory. Restart the API after `.env`
changes. Defaults include:

| Setting                                            | Default                                               |
| -------------------------------------------------- | ----------------------------------------------------- |
| `GEMINI_CHAT_MODEL`                                | `gemini-3.5-flash-lite`                               |
| `GEMINI_EMBEDDING_MODEL`                           | `gemini-embedding-001`                                |
| `PORTFOLIO_EMBEDDING_DIMENSIONS`                   | `768`                                                 |
| `PORTFOLIO_CHUNK_SIZE` / `PORTFOLIO_CHUNK_OVERLAP` | `1200` / `150` characters before the chunk header     |
| `PORTFOLIO_RETRIEVAL_TOP_K`                        | `6`                                                   |
| `PORTFOLIO_RETRIEVAL_MIN_SCORE`                    | `0.3` cosine similarity, not a confidence probability |
| `PORTFOLIO_PROVIDER_TIMEOUT_SECONDS`               | `30` per provider request                             |
| `PORTFOLIO_CHAT_MAX_ATTEMPTS`                      | `3` total attempts; configurable from 1 to 3          |
| `PORTFOLIO_MAX_OUTPUT_TOKENS`                      | `1200`                                                |
| `PORTFOLIO_INDEX_DIR`                              | `data/generated-index`                                |
| `PORTFOLIO_CONTENT_DIR`                            | `../content`                                          |
| `PORTFOLIO_SITE_URL`                               | `https://hulk914.github.io/PortfolioWebApp/`          |

Both defaults currently have a free tier listed in
[Google's pricing](https://ai.google.dev/gemini-api/docs/pricing); availability and
quotas depend on your project/region and can change. See
[embedding task types](https://ai.google.dev/gemini-api/docs/embeddings).
Use `retrieve` to inspect scores before tuning the threshold. Changing the chat
model/threshold does not require re-ingestion; changing the embedding model or
dimensions does. Gemini keys and owner tokens are backend-only configuration.

CORS defaults allow `http://127.0.0.1:4200` and `http://localhost:4200`. Hosted mode
also allows the origin of `PORTFOLIO_SITE_URL`, currently `https://hulk914.github.io`.
Additional `PORTFOLIO_CORS_ORIGINS` values use a JSON array of origins without a
`/PortfolioWebApp` path. CORS does not protect a public API from abuse; rate
limiting remains later work. Optional private tracing is implemented
as described below; public trace sharing is never enabled.

## Private LangSmith tracing

The backend reads tracing configuration directly from `.env`. Set:

```dotenv
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your-private-LangSmith-key
LANGSMITH_PROJECT=portfoliowebapp-local
LANGSMITH_ENDPOINT=https://apac.api.smith.langchain.com
```

The legacy aliases `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`, `LANGCHAIN_ENDPOINT`,
and `LANGCHAIN_TRACING`/`LANGCHAIN_TRACING_V2` are also supported. Canonical
`LANGSMITH_*` settings take precedence when both names are present. Use the
endpoint for your account's region; set `LANGSMITH_WORKSPACE_ID` if your key needs
an explicit workspace. `GOOGLE_API_KEY` is preferred for Gemini;
`GEMINI_API_KEY` remains supported. Set one Google key name consistently.

In the LangSmith `portfoliowebapp-local` project (or your configured project), look for
`portfolio.ingest` and `portfolio.chat`. Chat traces include `chroma.retrieve`,
`gemini.embed_query`, the Gemini model call, and structured parsing. Ingestion
records document embeddings and index update counts. Query traces include the
retrieved text/scores, prompts, answer, latency, and available model token usage.
The API returns the root `trace_id` for locating a request in your own dashboard.

For the owner's APAC account, `portfoliowebapp` is the app/agent name and
`portfoliowebapp-local` is its Local environment's backing tracing project. This
implementation's `LANGSMITH_PROJECT` uses that exact backing project name.
Restart the API after editing `.env`; settings are cached per process.

LangChain model/Runnable calls already provide automatic child traces when tracing
configuration is available. Our Pydantic settings read `.env` into a Settings
object rather than exporting it into the SDK's process environment, so we pass an
explicit LangSmith client/project through `tracing_context`. Plain Python ingestion
and direct Chroma calls also need the custom spans to make those stages visible.
An unchanged ingestion run has no embedding child span because it reuses its index.

Tracing is optional and private. It records question/context data only when you
enable it; no Settings objects, keys, or owner tokens are traced, and no sharing
API or public/private trace URL is exposed to portfolio visitors. CLI exit and
API shutdown flush pending traces. Tracing failures are logged without credentials
and do not replace a successful RAG answer.

Verified locally with the owner's configured keys: 35 real Gemini document
embeddings stored in Chroma; `POST /api/chat` returned HTTP 200 with six retrieved
chunks and five cited sources for an Angular experience question. The matching
private LangSmith trace and all retrieval/embedding/LLM/parser spans were read
back successfully. Owner review of the answers/traces remains the handoff step.

## Deployment to Vercel

`.github/workflows/ingest.yml`, named **Deploy backend to Vercel**, runs on main
pushes affecting `content/**`, backend code/dependencies/deployment configuration,
or the workflow itself. It also supports **Actions -> Deploy backend to Vercel ->
Run workflow**, selecting `main`. Enable **Re-embed every chunk** only for a forced
rebuild. Pull requests do not run provider calls or deploy.

The release sequence is:

1. Install locked dependencies and restore the previous index cache for reuse.
2. Ingest current content and verify the index matches this commit.
3. Package `portfolio.json`, its schema, and only the active Chroma collection in
   `backend/data/release/`. `release.json` records the commit, content/index IDs,
   and checksums. Upload `portfolio-backend-<commit-sha>` for seven days.
4. A dependent deployment job downloads that exact artifact and verifies it
   against the same checked-out commit and content.
5. The official, pinned Vercel CLI uploads code and the snapshot for a Linux cloud
   build using the project's Production environment. `--skip-domain` keeps the
   current production aliases in place while the candidate is checked.
6. Check hosted `/api/health` against the packaged revision, then make one real
   `/api/chat` request and validate its evidence chunks and citations.
7. Promote the verified deployment, then confirm the stable public health URL
   serves that revision. The workflow summary links the API and Swagger.

Ingestion, packaging, build, or candidate-chat failures prevent promotion. Each
successful deployment contains its own matching content and index; it does not
download artifacts from GitHub at request time. Generated databases, environment
files, local virtual environments, and frontend dependencies are excluded from
the upload. The prepared release directory is explicitly included despite Git's
ignore rules. No database files or bot commits are pushed to Git.

### Configuration checklist

Repository **Actions secrets**:

| Secret | Purpose |
| --- | --- |
| `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) | CI document embeddings |
| `VERCEL_TOKEN` | Official CLI deployment and project configuration |
| `VERCEL_ORG_ID` | Vercel team ID, beginning `team_` |
| `VERCEL_PROJECT_ID` | Backend project ID, beginning `prj_` |
| `LANGSMITH_API_KEY` (or `LANGCHAIN_API_KEY`) | Optional private ingestion tracing |

Repository **Actions variables** are optional when the defaults are suitable:

- `GEMINI_EMBEDDING_MODEL=gemini-embedding-001`,
  `PORTFOLIO_EMBEDDING_DIMENSIONS=768`, `PORTFOLIO_EMBEDDING_BATCH_SIZE=32`.
- `PORTFOLIO_CHUNK_SIZE=1200`, `PORTFOLIO_CHUNK_OVERLAP=150`, and
  `PORTFOLIO_SITE_URL=https://hulk914.github.io/PortfolioWebApp/`.
- `LANGSMITH_TRACING=true` to enable CI traces; defaults are the APAC endpoint
  `https://apac.api.smith.langchain.com` and project `portfoliowebapp-local`.
  `LANGSMITH_WORKSPACE_ID` is optional.
- `BACKEND_PRODUCTION_URL=https://portfolio-web-app-six-sage.vercel.app`.
  Changing this URL also requires updating Angular's production API configuration.

Vercel **Production environment variables** configure the running API separately:

- `GOOGLE_API_KEY` (or `GEMINI_API_KEY`).
- `GEMINI_CHAT_MODEL=gemini-3.5-flash-lite` and the same embedding model,
  dimensions, chunk settings, and site URL as CI when overriding their defaults.
- Optional LangSmith key, tracing, APAC endpoint, and project settings, using
  either the supported `LANGSMITH_*` or `LANGCHAIN_*` names.
- Optional retrieval, provider timeout, retry, and output settings from
  `.env.example`. The backend adds the portfolio origin to CORS automatically.

The GitHub credentials are not needed inside the running API. Local content/index
paths imported into Vercel are overridden by hosted mode. `PORTFOLIO_RUNTIME` is
set by `vercel.json`. Local `.env` files are never uploaded. Preview deployments
need their own Vercel Preview variables if you want to query them.

The project configuration step applies root directory `backend`, preset
`fastapi`, and protection that leaves stable production aliases public while
protecting previews and unique deployment URLs. CLI-authenticated checks can
access the protected candidate. `git.deploymentEnabled=false` disables automatic
Vercel Git deployments so this artifact-dependent workflow controls releases.
The job uses the `vercel-production` GitHub environment; any protection rules you
add there still apply.

### URLs and runtime storage

Use **https://portfolio-web-app-six-sage.vercel.app** as the stable API origin:

- Swagger: `/docs`
- Readiness and loaded revision: `GET /api/health`
- Recruiter answer: `POST /api/chat`

`portfolio-web-ew7455rmq-ayush-thakur2.vercel.app` identifies an older individual
deployment. Each new deployment receives a new unique URL; the stable production
alias follows successful promotions.

On cold startup, `app/rag/runtime.py` verifies the bundled snapshot, copies its
index to `/tmp/portfolio-chroma/<release-id>/`, and opens only that writable copy.
A lock prevents concurrent initialization. Content/schema remain in the immutable
bundle. Warm requests reuse the copy; a new function instance initializes its own.
No embeddings or ingestion run during startup.

**Hosted refreshes require a new deployment.** Run the manual GitHub workflow to
refresh the durable snapshot. Hosted `/api/ingest` returns HTTP 409 rather than
writing a temporary update that would disappear or differ across instances. Local
CLI and bearer-authorized ingestion continue to work. A GitHub runner's DB never
updates your laptop; after local content edits, run `uv run ingest` locally.

For local packaging checks, run from `backend/` after ingestion:

```sh
uv run --locked python scripts/package_release.py
uv run --locked python scripts/verify_release.py
```

The deployment gate uses `scripts/verify_hosted.py` for readiness plus one live
Gemini answer, rather than an automated unit/e2e suite. Native dependency size and
runtime compatibility are enforced by the actual Vercel build and hosted check.
Frontend Pages delivery remains independent; chat UI integration and rate limiting
remain later work.

Deployment validation on 24 November 2026: a private Vercel preview built
successfully, loaded the packaged 35-chunk index, and returned a real Gemini answer
with a citation and matching evidence chunks through `/api/chat`. The response
included a private LangSmith trace ID. This validates the hosted Python/Chroma
path. The completed, error-free `portfolio.chat` trace was also read back from
the owner's private LangSmith project. The main-push production workflow still
runs after these changes are pushed.
