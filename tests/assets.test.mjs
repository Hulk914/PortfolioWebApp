import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import sharp from 'sharp';

for (const name of ['dp_asset', 'tech-bg']) {
  test(
    name + ': optimized image retains every decoded pixel and reduces download size',
    async () => {
      const original = await readFile(new URL('../assets/' + name + '.png', import.meta.url));
      const optimized = await readFile(new URL('../assets/' + name + '.webp', import.meta.url));
      const before = await sharp(original)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const after = await sharp(optimized)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      assert.deepEqual(after.info, before.info);
      assert.ok(before.data.equals(after.data), 'Decoded pixels must be identical');
      assert.ok(optimized.length < original.length, 'The served image must be smaller');
    },
  );
}
