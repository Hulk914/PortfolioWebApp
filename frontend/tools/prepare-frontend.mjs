import { readFile, writeFile } from 'node:fs/promises';

const { profile } = JSON.parse(
  await readFile(new URL('../../content/portfolio.json', import.meta.url), 'utf8'),
);
const escapeHtml = (text) =>
  text.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );

// No professional copy is maintained in the HTML shell: metadata comes from JSON.
const index = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; base-uri 'self'; object-src 'none'; form-action 'none'; connect-src 'self' http://localhost:8000 https://*.vercel.app ws://localhost:* ws://127.0.0.1:*" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta name="description" content="${escapeHtml(profile.seoDescription)}" />
    <meta name="theme-color" content="#0b1013" />
    <title>${escapeHtml(profile.name)} | ${escapeHtml(profile.headline)}</title>
    <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  </head>
  <body id="top"><app-root></app-root></body>
</html>
`;
await writeFile(new URL('../src/index.html', import.meta.url), index);
console.log('Prepared frontend metadata from content/portfolio.json.');
