/**
 * Generate public/og-image.png from scripts/og-card.html via Playwright.
 * The card layout is a fixed 1200×630 — the standard OG / Twitter dimensions.
 *
 * Re-run with `npm run og` whenever the layout HTML or the corpus numbers
 * cited in the card change. The output is committed so social-card scrapers
 * see the latest values immediately on deploy.
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CARD = join(ROOT, 'scripts', 'og-card.html');
const OUT = join(ROOT, 'public', 'og-image.png');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2, // crisp text at retina; the file size stays modest
});
await page.goto(pathToFileURL(CARD).href, { waitUntil: 'load' });
await page.locator('.card').screenshot({ path: OUT });
await browser.close();
console.log(`wrote ${OUT}`);
