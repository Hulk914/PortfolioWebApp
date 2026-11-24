# Portfolio implementation checklist

Last updated: 24 November 2026.

## Working approach

Prioritize working code and completion of the MVP. Automated unit, integration,
browser, accessibility, and end-to-end suites are deferred until after the MVP.
Existing test files, configuration, dependencies, and test CI have been removed.
Do not recreate or rerun suites during each phase. Use necessary compilation/build
checks and address concrete implementation errors.

The first Angular milestone combines Phase 1, the shared content foundation from
Phase 2, and frontend build/deployment configuration from Phase 7. The UI migration
is approved and committed/pushed as `62bd278`. Backend work has started with a
local FastAPI stub; ingestion and RAG integration remain pending.

## Phase 0: audit and scaffold

- [x] Inspect the source, assets, helpers, configuration, and deployment.
- [x] Inventory five roles, six projects/resources, four skill groups, education,
      community information, links, and SEO metadata.
- [x] Confirm the public repository, main branch, and live Pages subpath.
- [x] Record local tool versions and compatibility requirements.
- [x] Propose Angular components, shared JSON, static rendering, and Pages delivery.
- [x] Outline later backend/RAG architecture and release risks.
- [x] Create the content/frontend/backend directory scaffold.
- [x] Remove automated testing infrastructure and update the MVP scope.
- [x] Review the proposal and authorize Angular implementation.

## First target: working Angular application

### Shared content

- [x] Extract all existing facts, full descriptions, workflows, caveats, tags,
      dates, and links into `content/portfolio.json`.
- [x] Define `portfolio.schema.json`, stable IDs, categories, typed detail blocks,
      and source/citation targets.
- [x] Add build-time content validation for required fields, IDs, references,
      dates, links, and assets. A separate validation test suite is deferred.
- [x] Document adding projects through JSON; derive counts and repeated identity.

### Angular

- [x] Create a strict standalone application in `frontend/`, using a compatible
      current stable release, an independent npm project, and a frontend lockfile.
- [x] Add typed models and a shared content service; pass data into components.
- [x] Implement header, hero, skills, timeline, project groups/cards/details,
      beyond-code/education, contact, and footer.
- [x] Preserve CSS, images, diagrams, disclosures, downloads, responsive layout,
      accessibility markup, and motion preferences.
- [x] Implement browser-only reveals and active navigation with lifecycle cleanup.
- [x] Configure static prerendering, hydration, metadata, and a compatible CSP.
- [x] Preserve fragments and support `/PortfolioWebApp/` with relative assets.
- [x] Document HTTP development, complete a production build, and fix build errors.

### GitHub Actions and Pages

- [x] Add CI for dependency installation, content validation, and production build.
- [x] Prepare Pages configure/upload/deploy actions with restricted permissions,
      deployment concurrency, automatic main-push deployment, and manual dispatch.
- [ ] Inspect the existing Pages source and record rollback information.
- [x] Present the working application and Pages-ready output for deployment approval.
- [x] Configure deployment on pushes to main with its own successful-build gate.
- [ ] Set the remote Pages source to GitHub Actions and perform the first deployment.
- [x] Consolidate assets/styles inside `frontend/src/` and update build/authoring helpers.
- [x] Remove the previous static HTML/JavaScript entry points and legacy helpers.
- [x] Remove duplicate PDF blobs, unused image tooling/dependency, QA snapshots,
      optional standalone redirect sample, and obsolete migration documentation.

Acceptance: working JSON-driven Angular code, a successful production build,
preserved portfolio content/design, reproducible Pages output, documented setup,
and empty backend folders. Test suites are not an MVP gate. First production
deployment and hosting-setting changes still require separate confirmation.

## UI handoff

- [x] Angular 22.3.0 production build succeeds for `/PortfolioWebApp/`.
- [x] Prerendered home and all six project pages; prepared 404 fallback and `.nojekyll`.
- [x] Make `/PortfolioWebApp` the explicit home route; empty, wildcard, and invalid
      project paths redirect there. Keep asset and router bases separate.
- [x] Local Angular development server starts on port 4200; `/` redirects to `/PortfolioWebApp`.
- [x] Add typed HttpClient API/chat contracts, timeout/error handling, and separate
      local/production API configuration; no startup API calls.
- [x] User approves the migrated UI.

No automated suites were added or run. Backend deployment is outside the current phase.

## Frontend project isolation

- [x] Place package metadata, lockfile, Node/formatter configuration, and build tools
      inside `frontend/`; keep shared content and repository workflows at root.
- [x] Update CI, deployment artifact paths, npm caching, and Dependabot for the
      standalone frontend project.
- [x] Complete a production build using only `frontend/node_modules` and remove
      the old root dependency/output folders.

## Backend phase: local FastAPI skeleton

- [x] Add a FastAPI entry point with separate chat and ingestion route modules.
- [x] Define validated request/response models matching the Angular chat contract.
- [x] Add `POST /api/chat` with a clearly identified static answer and no citations.
- [x] Add `POST /api/ingest` with a stub status and `index_updated: false`.
- [x] Configure local Angular CORS origins and an optional `.env.example`.
- [x] Pin dependencies and document virtual environment setup, Uvicorn, and Swagger.
- [x] Initialize a uv project with `pyproject.toml`, `uv.lock`, and Python 3.14 pinning.
- [x] Add cross-platform `uv run dev` and `uv run start` console commands and
      remove the separate pip requirements file.
- [x] Synchronize the locked uv environment and verify development startup on
      Python 3.14.6 with the same two API routes.
- [x] Confirm server startup; both POST stubs returned HTTP 200, OpenAPI lists
      exactly two application endpoints, and the local Angular CORS header is present.

Acceptance: both POST routes can be exercised through `/docs` or direct HTTP
calls. No keys, ingestion, embeddings, vector writes, LLM calls, or deployments
are part of this phase. Automated suites remain deferred.

## Later work

- [ ] Extend the shared content model as real content grows.
- [ ] Implement Python ingestion, semantic chunks, Gemini embeddings, local JSON
      vectors, content hashes, and an index manifest.
- [ ] Connect retrieval/LLM generation and grounded citations to the chat route.
- [ ] Connect manual ingestion and protect it when it performs real work.
- [ ] Add trusted ingestion automation for `content/**` changes and package the index.
- [ ] Add optional private LangSmith tracing.
- [ ] Build the recruiter chat UI with loading, error, and citation handling.
- [ ] Package the index with Vercel and coordinate backend/Pages releases.
- [ ] Document environment variables, supported models, and operational limits.
- [ ] After the working MVP, agree the scope of unit, integration, accessibility,
      and end-to-end tests and RAG evaluations before adding them.

The [application architecture](architecture.md) records the current design and
remaining backend phases. Descriptions mentioning tests in other project repositories remain
factual portfolio content.
