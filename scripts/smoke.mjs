/**
 * Headless runtime smoke test. Builds confidence that the app boots, the
 * worker loads every tokenizer, segmentation renders, and the gallery and
 * theme toggle work — things the unit tests cannot cover.
 *
 * Optional dev tool — not part of the CI test suite, so Playwright is not a
 * project dependency. Install it yourself first:
 *   npm i -D playwright && npx playwright install chromium
 *
 * Then, with a preview server running (default http://localhost:4173):
 *   npm run build  &&  npx vite preview --port 4173  &&  npm run smoke
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.SMOKE_URL || 'http://localhost:4173/';
const SHOTS = 'docs/screenshots';

const fail = (msg) => {
  console.error(`SMOKE FAIL: ${msg}`);
  process.exitCode = 1;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await mkdir(SHOTS, { recursive: true });

console.log(`Opening ${BASE}`);
await page.goto(BASE, { waitUntil: 'load' });

// 1. Token spans render for the preloaded sample. Results stream in one
//    tokenizer at a time, so wait for all seven rows to settle.
await page.waitForSelector('.tok', { timeout: 30_000 });
await page.waitForFunction(
  () => document.querySelectorAll('.row .count strong').length >= 7,
  { timeout: 30_000 },
);
const rows = await page.locator('.row').count();
console.log(`tokenizer rows: ${rows}`);
if (rows < 7) fail(`expected 7 tokenizer rows, saw ${rows}`);
const counts = await page.locator('.row .count strong').allInnerTexts();
console.log(`token counts: ${counts.join(', ')}`);
if (counts.some((c) => !/^[\d,]+$/.test(c.trim()))) fail('a row has no token count');
await page.screenshot({ path: `${SHOTS}/home-dark.png`, fullPage: true });

// 3. Gallery: load the Chinese sample, expect rows to re-render.
await page.getByText('Chinese: the token tax').click();
await page.waitForTimeout(1500);
const zhCounts = await page.locator('.row .count strong').allInnerTexts();
console.log(`chinese sample counts: ${zhCounts.join(', ')}`);
const nums = zhCounts.map((c) => parseInt(c.replace(/,/g, ''), 10));
if (new Set(nums).size < 3) fail('Chinese sample shows little tokenizer spread');
await page.locator('.cv').screenshot({ path: `${SHOTS}/hero-chinese.png` });

// 4. Comparison table and analysis panels exist.
if ((await page.locator('.ct table').count()) < 1) fail('comparison table missing');
if ((await page.locator('.apanel').count()) < 4) fail('expected 4 analysis panels');

// 5. Theme toggle.
await page.locator('.ibtn').first().click();
await page.waitForTimeout(300);
const theme = await page.evaluate(() =>
  document.documentElement.getAttribute('data-theme'),
);
console.log(`theme after toggle: ${theme}`);
if (theme !== 'light') fail('theme toggle did not switch to light');
await page.screenshot({ path: `${SHOTS}/home-light.png`, fullPage: true });

if (errors.length) {
  console.error(`console errors (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  fail('console errors present');
} else {
  console.log('no console errors');
}

await browser.close();
console.log(process.exitCode ? 'SMOKE: FAILED' : 'SMOKE: PASSED');
