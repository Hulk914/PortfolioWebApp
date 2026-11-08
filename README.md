# Ayush Thakur — Portfolio

A static portfolio for full-stack and applied AI engineering, forward deployed
engineering, and frontend architecture. The production page uses native HTML,
CSS, and a deferred JavaScript file. No runtime packages or build step are required.

## Preview

Open `index.html` directly, or use Node.js 24 (see `.nvmrc`):

```sh
npm ci
npm run dev
```

Visit `http://127.0.0.1:4173`. The local server serves only the public page and
assets; it does not expose the repository, tools, tests, or dependencies.

## Quality checks

```sh
npm run check
npx playwright install chromium
npm test
```

`npm run check` checks formatting, HTML semantics and references, JavaScript
syntax, the preview server's public-file boundary, and lossless image integrity.
`npm test` covers desktop, tablet, mobile, and intermediate widths; keyboard
navigation; active-section state; PDF loading; direct file preview; missing
browser APIs; JavaScript-disabled browsing; and reduced motion.

If Chrome is already installed, use it without downloading a test browser:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm test
```

On macOS/Linux, use `PLAYWRIGHT_CHANNEL=chrome npm test`.
Browser failure traces and screenshots are written to `test-results/`;
`npm run test:report` opens the HTML report.

[Playwright and axe](https://playwright.dev/docs/accessibility-testing) scan for
common WCAG A/AA issues. Automated scans complement manual keyboard, screen
reader, zoom, contrast-over-image, and browser testing; they do not establish
complete accessibility conformance.

The GitHub Actions workflow runs these checks on pushes and pull requests. It
uses a read-only token, pinned action commits, `npm ci`, and a locked dependency
tree. Dependabot proposes updates to development packages and actions.

## Design and engineering decisions

- **Progressive enhancement:** career content, anchors, contact links, and the
  resume work without JavaScript. Enhancements are scoped to an IIFE, feature
  detect browser APIs, and respect reduced-motion preferences.
- **Deterministic navigation:** active-section state is derived from visible
  sections in document order and cleared when no tracked section is being read.
- **Semantic HTML:** native landmarks, one primary heading, machine-readable
  employment dates, descriptive groups, and a keyboard-focusable skip target.
  New-tab announcements are available to screen readers without changing labels.
- **Consistent maintenance:** Prettier, EditorConfig, and Git line-ending rules
  make source formatting reproducible across operating systems.
- **Local assets:** no CDN fonts, runtime libraries, tracking, or third-party
  requests are required to render the page.
- **Defense in depth:** a same-origin
  [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
  blocks inline scripts, object embedding, base-URL overrides, and form submission.
  A referrer policy and `noopener noreferrer` protect outbound navigation.
  HTML validation requires SRI if cross-origin scripts or styles are added.

## Images and visual preservation

The original PNGs remain in `assets/` as editable sources and browser fallbacks.
Served WebP versions use lossless compression, retain the color profile, and
preserve the original dimensions. The optimization script compares decoded RGBA
pixels before writing each file. The two served images total 3,893,024 bytes,
compared with 7,463,984 bytes for the PNGs: about 48% less image data.

```sh
npm run optimize:images
npm run check
```

Run those commands after replacing either PNG. The high-priority portrait keeps
explicit dimensions to reserve layout space; it is not lazy-loaded.

## Updating content and hosting

- Edit the biography, skills, and career history in `index.html`.
- Replace `assets/resume.pdf` to update the resume; keep the filename stable.
- Run `npm run format`, `npm run check`, and `npm test` before publishing changes.
- Publish `index.html`, `styles.css`, `script.js`, and `assets/` on a static host.
  Do not publish development folders, dependencies, Git metadata, or reports.

Production HTTPS, compression, caching, and response headers are configured at
the hosting provider. In particular, `frame-ancestors` must be delivered as a CSP
HTTP header; it cannot be enforced through the page's meta policy. Configure
host-specific headers and a canonical URL when the production domain is known.
