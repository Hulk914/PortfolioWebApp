# Ayush Thakur - Portfolio

An Angular 22.3.0 portfolio with a uv-managed FastAPI backend and shared JSON
content. The UI migration is complete; backend chat/ingestion endpoints currently
return static placeholders while the RAG pipeline is developed in later phases.

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
  app/                      FastAPI routes, models, settings, and CLI
.github/workflows/          Frontend build and deployment workflows
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
uv run dev
```

Open **http://127.0.0.1:8000/docs** to try:

- `POST /api/chat`: validates a question and returns a static answer/empty citations.
- `POST /api/ingest`: returns a stub response with `index_updated: false`.

Python 3.14 and the backend environment are managed by uv. Use `uv run start` for
startup without auto-reload. From the repository root, `uv run --project backend dev`
is also supported. See [backend setup and API examples](backend/README.md).

## Content and deployment

[Edit content and add projects](content/README.md) through `content/portfolio.json`.
Angular components consume that shared source; the later Python ingestion pipeline
will read the same file. Public images/documents live in `frontend/src/assets/`.

The production URL stays **https://hulk914.github.io/PortfolioWebApp/**. Pull
requests run a frontend build. Main pushes build and deploy to GitHub Pages,
with successful build/artifact creation required before publishing. Workflows
install dependencies from `frontend/package-lock.json` and upload only
`frontend/dist/portfolio/browser/`. Repository Pages settings must use **GitHub
Actions** as the publishing source.

## Current scope

The Angular UI, JSON/schema, routing, API client foundation, and local FastAPI/uv
skeleton are implemented. Ingestion, retrieval/model generation, backend hosting,
and chatbot UI remain later phases. Automated suites remain deferred.

See the [implementation checklist](docs/implementation-checklist.md) and
[application architecture](docs/architecture.md).
