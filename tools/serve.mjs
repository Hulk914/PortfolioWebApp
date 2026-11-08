import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicFiles = new Set(['index.html', 'styles.css', 'script.js']);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

// A local development server, not a production server or an SPA fallback.
// Serve public assets only, never tools, tests, dependencies, or Git metadata.
export function createPreviewServer() {
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-cache');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }

    let relativePath;
    try {
      const url = new URL(request.url, 'http://localhost');
      relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    } catch {
      response.writeHead(400).end();
      return;
    }

    const requestedPath = resolve(root, relativePath);
    const assetRoot = resolve(root, 'assets') + sep;
    if (!publicFiles.has(relativePath) && !requestedPath.startsWith(assetRoot)) {
      response.writeHead(404).end();
      return;
    }

    try {
      const actualPath = await realpath(requestedPath);
      if (actualPath !== requestedPath && !actualPath.startsWith(assetRoot)) {
        response.writeHead(404).end();
        return;
      }
      const data = await readFile(actualPath);
      response.writeHead(200, {
        'Content-Type': contentTypes[extname(actualPath)] || 'application/octet-stream',
        'Content-Length': data.length,
      });
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch {
      response.writeHead(404).end();
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
  const server = createPreviewServer();
  server.listen(port, '127.0.0.1', () => {
    console.log('Portfolio: http://127.0.0.1:' + server.address().port);
  });
}
