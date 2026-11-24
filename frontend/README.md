# Angular frontend

Standalone Angular 22.3.0 application with all npm configuration and dependencies
contained in this directory. It consumes the shared `../content/portfolio.json`;
there is no root npm workspace or root package installation.

## Development

Use Node.js 24.15 or newer on the Node 24 line (see `.nvmrc`). Inside `frontend/`:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4200/PortfolioWebApp**. The local Angular CLI is included;
no global CLI, Python server, or API keys are needed for the portfolio UI.

| Command                      | Purpose                                                             |
| ---------------------------- | ------------------------------------------------------------------- |
| `npm run dev` or `npm start` | Prepare shared content/metadata and start Angular with live reload. |
| `npm run build`              | Validate content and generate production static output.             |
| `npm run build:pages`        | Build explicitly for the current Pages base path.                   |
| `npm run preview`            | Serve the production output locally on port 4173.                   |
| `npm run validate:content`   | Validate the shared JSON and local asset references.                |
| `npm run format`             | Format frontend code using its local Prettier configuration.        |

The corresponding root-directory command is `npm --prefix frontend run dev`
(or replace `dev` with another script). `node_modules/`, `.angular/`, and `dist/`
are local generated folders and remain ignored by Git.

## Production preview and routing

```sh
npm run build
npm run preview
```

Open **http://127.0.0.1:4173/PortfolioWebApp/**. Output is generated at
`dist/portfolio/browser/` inside this directory; Pages publishes only that output.

The explicit Angular entry route is `/PortfolioWebApp`. Empty and unmatched
routes, including invalid project slugs, redirect there. Project pages use
`/PortfolioWebApp/projects/<slug>` and are prerendered from shared JSON. The
production HTML base `/PortfolioWebApp/` locates assets, while `APP_BASE_HREF: /`
lets the router match complete paths without duplicating the repository prefix.

Known project pages support direct requests and refreshes. Generated `404.html`
bootstraps the router for unknown URLs; the initial unknown request still has an
HTTP 404 status before client routing redirects it. Development/preview use HTTP.

## Content and assets

The [shared authoring guide](../content/README.md) describes JSON updates.
`PortfolioContentService` imports the canonical content and components receive
records through signal inputs. Do not hardcode professional content in templates.

Assets live in `src/assets/`; their public URLs remain `assets/...`. The global
style entry imports `src/styles/portfolio.css`. Build/start scripts in `tools/`
validate content and generate `src/index.html` metadata from the profile JSON.

## Backend configuration

`ApiService` and `ChatbotService` provide typed backend calls, timeouts, and
consistent errors. No requests are made during portfolio startup. Configure the
public API URL in:

- `src/environments/environment.ts`: local `http://localhost:8000/api`.
- `src/environments/environment.production.ts`:
  `https://portfolio-web-app-six-sage.vercel.app/api`, the stable Vercel API URL.

Requests allow up to 150 seconds for the configured server timeout and bounded
Gemini retries. Start FastAPI in a separate terminal with `cd backend` and
`uv run start` when using the default local configuration. To use the hosted
backend without running Python locally, run `npm run dev:hosted` from `frontend/`.
This uses `environment.hosted.ts` and `proxy.hosted.json` to forward same-origin
`/api/**` requests to Vercel. The development proxy avoids needing localhost in
production CORS; production builds continue to call the Vercel API directly.

The CSP in `tools/prepare-frontend.mjs` permits Vercel API origins; add a custom
backend origin there if needed. API/provider credentials belong on the backend.
The Python backend runs separately; see [its setup guide](../backend/README.md).

## Portfolio assistant

The hero invitation and floating **Ask Ayush** launcher open a native dialog.
Desktop has a spacious conversation area and an optional evidence column;
mobile uses the full screen and switches to the evidence view when inspecting
a citation. Closing or minimizing preserves the conversation in memory. **New
chat** clears it. Refreshing the tab clears it too; no conversation is persisted
to localStorage or sent as history. Ask a complete question each time.

- `AssistantSessionService` owns the draft, bounded transcript, request state,
  manual retry/cooldown, and cancellation. Closing the dialog keeps a pending
  request running; **Stop waiting** unsubscribes from the browser request.
- `RecruiterAssistantComponent` owns the native dialog, accessible focus return,
  keyboard composer, status announcements, and citation selection.
- `ChatAnswerComponent` turns plain text into paragraphs/headings/lists with
  Angular text interpolation. It never renders model HTML or unsafe Markdown.
- `SourceEvidenceComponent` shows original cited chunks and all retrieved context,
  with section, source URL/file, chunk IDs, similarity, and content snapshot.
  Similarity is labeled as vector proximity, not confidence.
- `content/assistant.json` owns presentation copy, suggested questions, the
  pipeline explanation, and the free-tier availability message. Its schema is
  checked during content validation. Professional facts remain in portfolio JSON.

API failures retain the question and provide a manual retry. There is no extra
automatic browser retry loop on top of the server's retries. `Retry-After` is
honored up to 60 seconds. A successful response with `status: insufficient_context`
gets a distinct portfolio-boundary explanation, rather than a provider-error
message. Older backend responses without that field are supported using their
empty citation list.

Styles live beside each component but are imported into the external global
stylesheet with component element prefixes. This preserves the strict static
site CSP without runtime inline styles. Native dialog behavior follows the
[WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/):
focus stays in the dialog, Escape closes it, and focus returns to its opener.

## GitHub Actions

Root `.github/workflows/` files run npm commands with `frontend` as the working
directory, cache against this directory's lockfile, and upload
`frontend/dist/portfolio/browser/`. Dependabot also targets `/frontend` for npm.
No automated test suites are included in this MVP.
