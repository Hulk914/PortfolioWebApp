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
working FastAPI/Chroma/Gemini cycle and a verified hosted Vercel preview.

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
- [x] Verify successful GitHub Actions Pages deployments of the approved changes.
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

## Backend phase: local Chroma ingestion and RAG

- [x] Validate canonical JSON/schema and extract topic-specific LangChain documents.
- [x] Split within source boundaries using a configurable recursive text splitter.
- [x] Preserve stable IDs, metadata, and actual portfolio source citation URLs.
- [x] Use explicit Gemini document/query embeddings with matching model/dimensions.
- [x] Build local cosine Chroma snapshots with embedding reuse and atomic manifests.
- [x] Exclude deleted content from the published collection and detect stale indexes.
- [x] Share ingestion across CLI and owner-authorized manual API; serialize writers.
- [x] Connect nearest-vector retrieval, structured Gemini generation, and checked citations.
- [x] Return exact retrieved chunks and scores, mark model-cited evidence, preserve
      every cited chunk ID per document, and synchronize the Angular response types.
- [x] Handle unsupported questions, missing configuration/index, and provider failures.
- [x] Diagnose a real Gemini high-demand HTTP 503, add bounded server-error retries
      and an actionable busy response, and verify the same question returns HTTP 200.
- [x] Add uv ingestion, dry-run, retrieval, question, and index-inspection commands.
- [x] Lock dependencies and prepare trusted main-push CI ingestion/cache/artifact creation.
- [x] Document local secrets, Actions secret, API usage, and the Vercel persistence boundary.
- [x] Verify a real-content dry run (34 documents, 35 chunks), local Chroma
      persistence/reopen/vector lookup/manifest publication, API startup/OpenAPI,
      and safe missing-configuration responses. Remove temporary storage-check data.
- [x] Confirm Gemini clients and the structured answer schema initialize without
      making provider requests.
- [x] Recognize owner-provided Google and LangChain/LangSmith key aliases without exposing secrets.
- [x] Run real ingestion: 35 Gemini vectors stored for 34 content documents.
- [x] Verify HTTP 200 from FastAPI chat with six retrieved chunks and five cited sources.
- [x] Read back the completed private LangSmith trace and successful retrieval/embedding/LLM/parser spans.
- [ ] Owner reviews Swagger answers and LangSmith traces manually; configure an owner token before manual API ingestion.
- [x] Owner configures Actions Gemini/Vercel secrets and repository variables.
- [ ] Push this phase and verify the remote ingestion artifact and production workflow.

Acceptance: working local backend cycle from content to vectors to grounded answers.
Live Gemini ingestion/chat and private tracing have been verified with the owner's
configured credentials. No fake production model or index is substituted. No
unit/e2e suites are introduced. The deployment phase below extends the artifact
workflow to Vercel; frontend Pages delivery remains independent.

## Backend phase: ingestion-gated Vercel deployment

- [x] Add a deployment job depending on successful ingestion and snapshot packaging.
- [x] Package matching content JSON, schema, active Chroma collection, index manifest,
      commit revision, and checksums in one artifact.
- [x] Verify downloaded release bytes against the same checked-out content/revision.
- [x] Upload through the official pinned Vercel CLI for a Linux cloud build.
- [x] Verify the immutable bundle and initialize a locked writable Chroma copy in `/tmp`.
- [x] Add readiness metadata, production CORS, the stable frontend API URL, and Swagger redirect.
- [x] Disable direct Vercel Git deployments; configure public production aliases and
      protected preview/unique URLs through the deployment workflow.
- [x] Verify candidate health, content/index revision, and one grounded hosted chat
      response before promotion; verify the public alias after promotion.
- [x] Preserve local owner ingestion; direct hosted refreshes to manual workflow dispatch.
- [x] Build a private preview on Vercel and verify real `/api/chat` generation,
      matching Chroma content, evidence chunks, citation, and returned trace ID.
- [x] Document secrets, runtime variables, URLs, local commands, and refresh behavior.
- [ ] Owner pushes to main; verify GitHub production deployment and public alias.

Verified preview: `https://portfolio-web-7ickyphrp-ayush-thakur2.vercel.app`.
This preview uses the local snapshot revision; production packaging uses the
GitHub commit SHA. Production has not been promoted from this workspace.

## Later work

- [ ] Extend the shared content model as real content grows.
- [x] Implement Python ingestion, semantic chunks, Gemini embeddings, local
      Chroma collections, content hashes, and an index manifest.
- [x] Connect retrieval/LLM generation and grounded citations to the chat route.
- [x] Connect manual ingestion and protect it with an owner bearer token.
- [x] Add trusted ingestion automation for `content/**` changes and package the index as an artifact.
- [x] Add optional private LangSmith tracing.
- [ ] Build the recruiter chat UI with loading, error, and citation handling.
- [x] Package and deploy the matching index with Vercel after ingestion succeeds.
- [ ] Coordinate backend/Pages releases when the chatbot UI is integrated.
- [x] Document backend environment variables, supported models, and storage limits.
- [ ] After the working MVP, agree the scope of unit, integration, accessibility,
      and end-to-end tests and RAG evaluations before adding them.

The [application architecture](architecture.md) records the current design and
remaining backend phases. Descriptions mentioning tests in other project repositories remain
factual portfolio content.
