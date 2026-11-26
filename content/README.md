# Editing portfolio content

`portfolio.json` is the source of truth for the Angular portfolio and the Python
ingestion pipeline. `portfolio.schema.json` documents its supported shape.

Edit the JSON to change your profile, experience, skills, projects, education, or
personal information. Angular imports it through `PortfolioContentService` and
passes the relevant records into standalone components. Do not add professional
facts to component templates or TypeScript files.

## Add a project

1. Copy a similar record in `projects` and assign a new, stable `id`, `slug`, and
   `titleId`. Use lowercase words separated by hyphens.
2. Set `groupId` to a record in `projectGroups`: currently `ai-projects`,
   `python-projects`, or `misc-projects`.
3. Update its title, kind, summary, technology tags, and links. External links use
   `external: true`; PDF downloads use a relative `assets/...` URL and a `download`
   filename. Keep detailed explanations and qualification/verification caveats.
4. Update `details` with the full explanation. Each element has a `tag`, optional
   `className`/accessible labels/ID, and `children`. Plain text uses `{ "text": "..." }`.
   This retains semantic headings, paragraphs, lists, code, and workflows without
   executable HTML. Copy an existing layout to retain its styling.
5. Put any new public document/image in `frontend/src/assets/`. Angular copies
   these directly into the public `assets/` directory during builds. Keep JSON
   links as `assets/...`; filesystem organization does not change public URLs.
6. Run `npm run build` inside `frontend/` (or `npm --prefix frontend run build`
   from the repository root). Fix content/build diagnostics,
   then open the application locally to review it.

Example detail paragraph:

```json
{
  "tag": "p",
  "children": [
    { "text": "Your factual project explanation, with " },
    { "tag": "code", "children": [{ "text": "inline code" }] },
    { "text": " where useful." }
  ]
}
```

The build validates field types, allowed element tags, required fields, duplicate
IDs/slugs/anchors, category and project references, dates, grades, links, and local
assets. Category counts are calculated from the projects array. The project page
`/PortfolioWebApp/projects/<slug>` is prerendered automatically from the same record.

Array order controls display order. Employment dates use `YYYY-MM`; use a null
`endDate` only for a role that is actually current. Keep stable IDs unchanged when
editing copy. Add `relatedProjectIds` only when an employer/project relationship
is supported by the source information.

The category controls filter the list to one group at a time; **All** restores
every group. Labels, counts, and filter options come from `projectGroups` and
`projects`, so adding a project needs no category-specific UI or route edits.

During `npm run dev`, imported JSON changes rebuild the UI. Assets are served
from `frontend/src/assets/` directly; refresh the browser after replacing a file.
Production builds regenerate metadata and copy public assets. The Angular app uses this JSON as its only professional-content source.

## Refresh the backend knowledge base

From `backend/`, run `uv run ingest` after editing content, or call the owner-only
`POST /api/ingest`. `uv run ingest --dry-run` validates and shows chunks/sources
without calling Gemini. Chat refuses a stale index until ingestion finishes.

Main pushes affecting `content/**` also run the trusted ingestion workflow and
produce a Chroma backend artifact; configure the `GEMINI_API_KEY` Actions secret
first. This updates the runner's index, not your laptop or an already running API.
Successful ingestion packages the matching content/schema/index, deploys it to
Vercel, checks a grounded answer, and promotes the backend. Local databases are
still separate. See [backend setup](../backend/README.md).

For a normal project addition, edit `portfolio.json`, validate/build the frontend,
and run `uv run --locked ingest --dry-run` from `backend/` to check extraction
without model calls or database writes. No vector files need manual edits. After
you push to `main`, the existing workflow embeds new or changed chunks, reuses
unchanged embeddings from its cached index when available, and deploys the
matching backend snapshot. A cache miss rebuilds the index. The workflow needs
the configured Gemini and Vercel Actions secrets; no manual production reindex
is needed. For a local index refresh only, use `uv run --locked ingest` with a
local Gemini key configured (see the backend setup guide).

## Assistant presentation

`assistant.json` contains the chat launcher's labels, welcome copy, suggested
questions, architecture explanation, availability humor, and privacy note.
`assistant.schema.json` validates this UI copy during frontend builds. Keep each
suggested question within 500 characters and grounded in the documented portfolio.
Changing this presentation file rebuilds the frontend; it does not add facts to
the RAG corpus. The backend continues to index only `portfolio.json`.
