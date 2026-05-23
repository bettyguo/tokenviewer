/**
 * One-shot substitution of the `OWNER` placeholder with the real GitHub owner
 * before the first deploy. Run once per fork:
 *
 *   node scripts/set_repo_url.mjs <github-owner>
 *
 * Touches package.json, src/ui/Header.svelte, README.md, index.html, and the
 * launch docs. Idempotent — running it again with the same owner is a no-op.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = [
  'package.json',
  'src/ui/Header.svelte',
  'README.md',
  'index.html',
  'docs/launch/BLOG_POST.md',
  'docs/launch/HN_SUBMISSION.md',
  'docs/launch/X_THREAD.md',
  'docs/launch/DEMO_SCRIPT.md',
];

const owner = process.argv[2];
if (!owner || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(owner)) {
  console.error('Usage: node scripts/set_repo_url.mjs <github-owner>');
  console.error('  owner must be a valid GitHub username (alphanumerics + hyphens).');
  process.exit(2);
}

const PLACEHOLDER_PATTERNS = [/OWNER\.github\.io/g, /github\.com\/OWNER\b/g];
const REPLACEMENTS = [`${owner}.github.io`, `github.com/${owner}`];

let touched = 0;
for (const rel of FILES) {
  const path = join(ROOT, rel);
  let body;
  try {
    body = await readFile(path, 'utf8');
  } catch {
    continue;
  }
  let next = body;
  for (let i = 0; i < PLACEHOLDER_PATTERNS.length; i++) {
    next = next.replace(PLACEHOLDER_PATTERNS[i], REPLACEMENTS[i]);
  }
  if (next !== body) {
    await writeFile(path, next);
    console.log(`  patched  ${rel}`);
    touched++;
  } else {
    console.log(`  skip     ${rel} (no placeholder)`);
  }
}
console.log(`\nDone. ${touched} file(s) patched.`);
console.log(
  `Next: commit the substitution, then push to enable GitHub Pages on https://${owner}.github.io/tokenviewer/`,
);
