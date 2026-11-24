import { copyFile, writeFile } from 'node:fs/promises';

const output = new URL('../dist/portfolio/browser/', import.meta.url);
// Known project pages are prerendered; unknown URLs bootstrap the router fallback.
await copyFile(new URL('index.html', output), new URL('404.html', output));
await writeFile(new URL('.nojekyll', output), '');
console.log('Prepared Pages fallback and .nojekyll in dist/portfolio/browser.');
