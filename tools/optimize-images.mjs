import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Originals remain the source of truth. Never resize, crop, or use lossy encoding.
const assets = new URL('../assets/', import.meta.url);
for (const name of ['dp_asset', 'tech-bg']) {
  const source = await readFile(new URL(name + '.png', assets));
  const result = await sharp(source)
    .keepIccProfile()
    .webp({ lossless: true, exact: true, effort: 6 })
    .toBuffer();
  const originalPixels = await sharp(source).ensureAlpha().raw().toBuffer();
  const optimizedPixels = await sharp(result).ensureAlpha().raw().toBuffer();
  assert.ok(originalPixels.equals(optimizedPixels), name + ': lossless pixel check failed');
  const destination = new URL(name + '.webp', assets);
  await writeFile(destination, result);
  console.log(fileURLToPath(destination) + ': ' + source.length + ' → ' + result.length + ' bytes');
}
