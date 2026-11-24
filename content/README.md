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
Backend artifact deployment is a later phase. See [backend setup](../backend/README.md).
