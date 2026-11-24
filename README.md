# Ayush Thakur - Angular Portfolio

An Angular 22.3.0 portfolio with standalone components, shared JSON content,
static prerendering, and GitHub Pages deployment configuration. The existing
appearance, complete project explanations/workflows, experience timeline, native
disclosures, images, documents, and responsive layout are preserved.

## Run locally

Use Node.js 24.15 or newer on the Node 24 line (the current workspace uses
24.21.0). Run these commands from the repository root:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4200/PortfolioWebApp**. Opening `/` redirects there. The local Angular CLI is included; no global CLI,
Python setup, API key, or running backend is needed. Stop the server with Ctrl+C.
Content changes rebuild the UI. Images/documents are served directly from the Angular assets folder.

## Production preview

```sh
npm run build
npm run preview
```

Open **http://127.0.0.1:4173/PortfolioWebApp/**. Production builds use the existing
GitHub Pages path by default; opening the preview server at `/` redirects there.
The explicit Pages build command is also available:

```sh
npm run build:pages
npm run preview
```

Open **http://127.0.0.1:4173/PortfolioWebApp/**. Both builds write static files to
`dist/frontend/browser/`; only that directory is published. A build validates the
content, generates metadata/assets, compiles Angular, prerenders the home page and
every project, and prepares the Pages fallback.

## Content and components

```text
content/
  portfolio.json             Canonical professional and presentation content
  portfolio.schema.json      Shared JSON Schema
  README.md                  Editing and adding projects
frontend/
  angular.json                Build, development, and static-output configuration
  src/app/
    components/               Header, hero, skills, experience, projects, beyond,
                              contact, footer, and reusable content/link/icon views
    pages/                    Home portfolio and individual project pages
    directives/               Scroll reveals and reduced-motion handling
    services/                 Content, navigation, metadata, API, and chatbot contract
    models/                   Portfolio and future backend response types
  src/assets/                 Images, favicon, resume, and guide PDFs
  src/styles/portfolio.css    Migrated portfolio stylesheet
  src/environments/           Local and production API configuration
backend/                      Empty scaffold for later Python/RAG work
tools/                        Content preparation, build, and static preview
.github/workflows/            Pull-request builds and automatic main deployment
```

[Edit content and add projects](content/README.md) through `content/portfolio.json`.
A typed content service imports that file at build time, and components receive
its records through signal inputs. Group counts and repeated identity/company
labels are derived. Detailed content is a safe structured tree of text, headings,
paragraphs, lists, and workflow steps, ready for later Python extraction.

Public source assets now live in `frontend/src/assets/`, and the migrated design
stylesheet is `frontend/src/styles/portfolio.css`. Angular copies those assets
directly to the build's `assets/` directory; no intermediate staging is needed.
Public URLs such as `assets/resume.pdf` are unchanged. Downloads use the original
PDFs directly. `frontend/src/index.html` is generated from the canonical profile
metadata.

## Routing and static hosting

- `/PortfolioWebApp` is the explicit home route and preserves section/category fragments.
- `/` redirects to `/PortfolioWebApp` with `pathMatch: full`.
- `/PortfolioWebApp/projects/<slug>` shows an expanded project; click a project title to open it.
- The wildcard route and unknown project slugs redirect to `/PortfolioWebApp`.
- The build prerenders every known project into its own `index.html`. Known deep
  links can load and refresh on Pages without a Node server.
- `404.html` bootstraps Angular for unknown URLs. GitHub still returns HTTP 404 for
  that first unknown request before client routing redirects; this is a static-host
  limitation. Valid prerendered project pages do not rely on that fallback.
- Angular routing uses `APP_BASE_HREF: /` because the route itself contains
  `PortfolioWebApp`. The production HTML base stays `/PortfolioWebApp/` for assets,
  so links do not acquire a doubled prefix.
- Relative asset/document links respect the build's base href. Angular development
  and preview use HTTP rather than opening compiled files through `file://`.

The production URL remains **https://hulk914.github.io/PortfolioWebApp/**. The
deployment workflow rejects a Pages configuration with a different base path.

## Future backend calls

`ApiService` uses Angular HttpClient/fetch, typed responses, configurable timeouts,
and consistent `ApiError` handling. `ChatbotService` provides lazy `health()` and
`ask(question)` calls for the future `GET /api/health` and `POST /api/chat` contract.
No API requests occur during portfolio startup; the chatbot UI is a later phase.

Configure public API settings in:

- `frontend/src/environments/environment.ts`: local default
  `http://localhost:8000/api`.
- `frontend/src/environments/environment.production.ts`: set `api.baseUrl` to
  `https://your-backend.vercel.app/api` when deployed; currently unset.

The production environment is selected by the production build. API credentials
belong only on the future Python backend. The current CSP permits Vercel API
origins; if using a custom backend domain, add its origin to `connect-src` in
`tools/prepare-frontend.mjs`. Configure backend CORS for the actual frontend origin:
`http://127.0.0.1:4200` locally and `https://hulk914.github.io` on Pages (no path).

## GitHub Actions and deployment

`ci.yml` installs the locked dependencies and builds for the repository path on
pull requests. Automated test suites remain deferred for the MVP.

`deploy.yml` runs on pushes to main and also supports manual dispatch. It confirms the configured Pages
base path is `/PortfolioWebApp/`, builds, uploads `dist/frontend/browser`, and deploys using the official
Pages actions. Actions are pinned; no personal access token or AI secrets are needed.
Before pushing, open repository Pages settings and select **GitHub Actions** as
its publishing source. Main pushes then build and deploy Angular automatically.
The deployment workflow includes its own successful-build gate, so main does not
run a duplicate CI build.

## MVP scope

The UI migration, JSON model, API service foundation, routing, and build setup are
implemented. Python, RAG ingestion, chatbot UI, and unit/end-to-end suites are later
work. Optional formatting is available with `npm run format`.

See the [implementation checklist](docs/implementation-checklist.md) and the
[application architecture](docs/architecture.md).
