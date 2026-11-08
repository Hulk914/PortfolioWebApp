import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { createPreviewServer } from '../tools/serve.mjs';

let server;
let baseURL;
before(async () => {
  server = createPreviewServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseURL = 'http://127.0.0.1:' + server.address().port;
});
after(() => new Promise((resolve) => server.close(resolve)));

test('serves the page, styles, script, and resume with correct content types', async () => {
  for (const [path, type] of [
    ['/', 'text/html'],
    ['/styles.css', 'text/css'],
    ['/script.js', 'text/javascript'],
    ['/assets/resume.pdf', 'application/pdf'],
  ]) {
    const response = await fetch(baseURL + path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get('content-type').startsWith(type), path);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    await response.arrayBuffer();
  }
});

test('supports HEAD and query strings without returning a body', async () => {
  const response = await fetch(baseURL + '/assets/resume.pdf?v=1', { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.ok(Number(response.headers.get('content-length')) > 0);
  assert.equal(await response.text(), '');
});

test('does not expose source tools, dependencies, dotfiles, or parent paths', async () => {
  for (const path of [
    '/.git/config',
    '/package.json',
    '/tools/serve.mjs',
    '/node_modules/prettier/package.json',
    '/assets/%2e%2e%2fpackage.json',
  ]) {
    const response = await fetch(baseURL + path);
    assert.equal(response.status, 404, path);
    await response.arrayBuffer();
  }
});

test('rejects unsupported methods, malformed URLs, and missing assets', async () => {
  assert.equal((await fetch(baseURL + '/', { method: 'POST' })).status, 405);
  assert.equal((await fetch(baseURL + '/%ZZ')).status, 400);
  assert.equal((await fetch(baseURL + '/assets/missing.webp')).status, 404);
});
