/**
 * Regenerate scripts/tokenizer_assets.lock.json from whatever is currently in
 * public/tokenizers/. Run this after intentionally bumping a tokenizer (then
 * also regenerate tests/fixtures/reference.json via gen_reference.py and
 * commit both in the same PR — they must stay aligned).
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public', 'tokenizers');
const LOCK_PATH = join(ROOT, 'scripts', 'tokenizer_assets.lock.json');

async function* walk(dir, prefix = '') {
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const s = await stat(full);
    const key = prefix ? `${prefix}/${name}` : name;
    if (s.isFile()) yield { key, full };
    else if (s.isDirectory()) yield* walk(full, key);
  }
}

const files = {};
for await (const { key, full } of walk(SRC)) {
  const buf = await readFile(full);
  files[key] = createHash('sha256').update(buf).digest('hex');
}

const lock = JSON.parse(await readFile(LOCK_PATH, 'utf8'));
lock.files = Object.fromEntries(Object.entries(files).sort());
await writeFile(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n');
console.log(`wrote ${LOCK_PATH} with ${Object.keys(files).length} entries`);
