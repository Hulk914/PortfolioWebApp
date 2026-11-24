import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist/portfolio/browser/', import.meta.url)));
const index = await readFile(resolve(root, 'index.html'), 'utf8').catch(() => {
  throw new Error('Build the Angular application with npm run build first.');
});
const base = index.match(/<base href="([^"]+)"/)?.[1] ?? '/';
const port = Number(process.env.PORT ?? 4173);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (base !== '/' && (pathname === '/' || pathname === base.slice(0, -1))) {
    response.writeHead(302, { Location: base }).end();
    return;
  }
  if (!pathname.startsWith(base)) {
    response.writeHead(404).end();
    return;
  }
  const requested = resolve(root, pathname.slice(base.length) || 'index.html');
  if (!requested.startsWith(root + sep) && requested !== resolve(root, 'index.html')) {
    response.writeHead(404).end();
    return;
  }
  let path = requested;
  let statusCode = 200;
  try {
    const info = await stat(path);
    if (info.isDirectory()) path = resolve(path, 'index.html');
    path = await realpath(path);
    if (!path.startsWith(root + sep)) {
      response.writeHead(404).end();
      return;
    }
    const data = await readFile(path);
    response.writeHead(statusCode, {
      'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    if (extname(pathname)) {
      response.writeHead(404).end();
      return;
    }
    // Mirror Pages: unknown URLs serve the SPA document with a 404 status.
    statusCode = 404;
    response.writeHead(statusCode, { 'Content-Type': contentTypes['.html'] });
    response.end(request.method === 'HEAD' ? undefined : await readFile(resolve(root, '404.html')));
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Angular preview: http://127.0.0.1:${port}${base}`),
);
