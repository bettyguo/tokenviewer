/**
 * Serve `dist/` under `/tokenviewer/` so we can verify the GitHub Pages
 * deploy locally before pushing — a Pages project site lives at
 * https://<owner>.github.io/<repo>/, which is a subpath, and is exactly
 * the setup that catches absolute-URL bugs (e.g., `/fonts/...` 404s,
 * missing `base: './'`).
 *
 * Run: `node scripts/pages_serve.mjs [port] [base]`
 *   - port defaults to 8123
 *   - base defaults to /tokenviewer/ (must start and end with /)
 *
 * 404s also redirect to the base via `public/404.html`, mirroring Pages.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// BASE is hardcoded because passing `/tokenviewer/` through Git-for-Windows
// MSYS layers mangles it into `C:\Program Files\Git\tokenviewer\`. PORT can
// still be overridden via the env or first argv.
const PORT = Number(process.env.PAGES_PORT || process.argv[2] || 8123);
const BASE = '/tokenviewer/';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

function mime(path) {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  return MIME[ext] || 'application/octet-stream';
}

async function tryRead(rel) {
  const safeRel = normalize(rel).replace(/^[/\\]+/, '');
  if (safeRel.includes('..' + sep)) return null;
  const full = join(DIST, safeRel);
  try {
    const s = await stat(full);
    if (s.isDirectory()) {
      // Index lookup
      const indexPath = join(full, 'index.html');
      return { body: await readFile(indexPath), path: indexPath };
    }
    return { body: await readFile(full), path: full };
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  // Outside base → 404 (matches Pages exactly).
  if (!url.startsWith(BASE) && url !== BASE.slice(0, -1)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found (outside ' + BASE + ')');
    return;
  }
  let rel = url === BASE.slice(0, -1) ? '/' : url.slice(BASE.length - 1);
  if (rel === '' || rel === '/') rel = '/index.html';

  const got = await tryRead(rel);
  if (got) {
    res.writeHead(200, { 'content-type': mime(got.path), 'cache-control': 'no-cache' });
    res.end(got.body);
    return;
  }

  // Mimic Pages 404 behavior: serve dist/404.html (which meta-refreshes to ./).
  const four04 = await tryRead('/404.html');
  if (four04) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(four04.body);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`Serving ${DIST} under ${BASE} at http://localhost:${PORT}${BASE}`);
});
