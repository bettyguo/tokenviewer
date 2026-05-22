/**
 * Downloads the self-hosted JetBrains Mono web fonts into `public/fonts/`.
 *
 * Fonts are self-hosted so the deployed app never contacts a third-party font
 * CDN — the privacy guarantee depends on it. If this download fails the app
 * still works: the CSS falls back to the platform monospace font.
 *
 * Run with `npm run fetch:assets` (or `npm run setup`).
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'fonts');

// JetBrains Mono (SIL Open Font License 1.1), latin subset, via the jsDelivr
// mirror of @fontsource/jetbrains-mono.
const FONTS = [
  {
    file: 'jetbrains-mono-regular.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.woff2',
  },
  {
    file: 'jetbrains-mono-medium.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-500-normal.woff2',
  },
];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('Fetching fonts into public/fonts/ ...');
  for (const { file, url } of FONTS) {
    const dest = join(OUT, file);
    if (await exists(dest)) {
      console.log(`  skip   ${file} (exists)`);
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      console.log(`  write  ${file}`);
    } catch (err) {
      console.warn(
        `  WARN   could not fetch ${file}: ${err.message} — the app will ` +
          `fall back to the platform monospace font.`,
      );
    }
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
