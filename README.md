# Ayush Thakur - Portfolio

An Angular 22.3.0 portfolio with a uv-managed FastAPI backend and shared JSON
content. The UI migration is complete. The backend ingests the same JSON into local Chroma
and answers recruiter questions through Gemini with portfolio citations.
The **Ask Ayush** assistant opens from a hero invitation or floating launcher,
with readable answers and an evidence drawer for inspecting the actual chunks.

## Repository layout

```text
content/                    Canonical portfolio JSON, schema, and editing guide
frontend/
  package.json              Angular dependencies and npm commands
  package-lock.json         Locked frontend dependency graph
  node_modules/             Local frontend dependencies (ignored)
  angular.json              Angular build and development configuration
  src/                      Standalone components, services, styles, and assets
  tools/                    Content validation, build preparation, and preview
  dist/portfolio/browser/   Generated GitHub Pages output (ignored)
backend/
  pyproject.toml            Python dependencies and uv commands
  uv.lock                   Locked backend dependency graph
  .venv/                    Local Python environment (ignored)
  app/                      FastAPI routes, models, settings, CLI, and RAG pipeline
  scripts/                  Ingestion and question script entry points
  data/generated-index/     Local Chroma database and manifest (ignored)
  data/release/             Matching content/schema/index deployment snapshot (ignored)
.github/workflows/          Frontend delivery and ingestion-gated backend deployment
docs/                       Architecture and implementation progress
```

The frontend and backend are independent projects. Node manifests, dependencies,
version/formatter configuration, build helpers, and output live under `frontend/`.
Python project configuration and its environment live under `backend/`. Shared
content, repository conventions, documentation, and GitHub workflows stay at root.

## Run the frontend

Use Node.js 24.15 or newer on the Node 24 line; see `frontend/.nvmrc`.
From the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:4200/PortfolioWebApp**. Opening `/` redirects there. No
backend or API keys are needed to browse the portfolio. From the repository root
you can also use `npm --prefix frontend run dev` after installing dependencies.

To build and preview, run these commands inside `frontend/`:

```sh
npm run build
npm run preview
```

Open **http://127.0.0.1:4173/PortfolioWebApp/**. The build validates shared content,
generates metadata, compiles Angular, prerenders home/project pages, and prepares
Pages files in `frontend/dist/portfolio/browser/`.

See [frontend setup and configuration](frontend/README.md) for all npm commands,
routing, assets, and API configuration.

## Run the backend

In a separate terminal, from the repository root:

```sh
cd backend
uv sync --locked
# Copy .env.example to .env; set GOOGLE_API_KEY (or GEMINI_API_KEY) and PORTFOLIO_INGESTION_TOKEN.
uv run ingest
uv run dev
```

Open **http://127.0.0.1:8000/docs** to try:

- `POST /api/chat`: retrieves relevant Chroma chunks and returns a grounded Gemini
  answer with verified portfolio citations.
- `POST /api/ingest`: refreshes the local index; requires your owner bearer token.

Python 3.14 and the backend environment are managed by uv. Use `uv run start` for
startup without auto-reload. From the repository root, `uv run --project backend dev`
is also supported. See [backend setup and API examples](backend/README.md).

## Content and deployment

[Edit content and add projects](content/README.md) through `content/portfolio.json`.
Angular components and the Python ingestion pipeline consume that shared source. Public images/documents live in `frontend/src/assets/`.

The production URL stays **https://hulk914.github.io/PortfolioWebApp/**. Pull
requests run a frontend build. Main pushes build and deploy to GitHub Pages,
with successful build/artifact creation required before publishing. Workflows
install dependencies from `frontend/package-lock.json` and upload only
`frontend/dist/portfolio/browser/`. Repository Pages settings must use **GitHub
Actions** as the publishing source.

The **Deploy backend to Vercel** workflow runs on main pushes affecting shared
content or backend code. It ingests, packages matching content/schema/Chroma,
deploys through the official Vercel CLI, and checks one real Gemini answer before
promoting the release. The stable backend origin is
**https://portfolio-web-app-six-sage.vercel.app**, with Swagger at `/docs` and
readiness at `/api/health`. GitHub Actions secrets and Vercel runtime variables
are configured separately; see the [backend deployment guide](backend/README.md#deployment-to-vercel).
Frontend Pages delivery remains an independent workflow.

## Current scope

Angular, shared content/schema, FastAPI/uv, document extraction and chunking,
incremental Chroma ingestion, retrieval, Gemini generation/citations, and trusted
CI ingestion and the Vercel release flow are implemented. Run
`uv run ingest --dry-run` without keys to inspect extraction; see the backend
README for live setup. The recruiter chat UI is implemented locally and ready for
review. Coordinated frontend/backend releases remain later work. Optional private
LangSmith tracing is implemented and locally verified.
Automated suites remain deferred.

See the [implementation checklist](docs/implementation-checklist.md) and
[application architecture](docs/architecture.md).
