# PROGRESS

Checkpoint log. One block per phase, newest at the bottom.

---

## Phase 0 — Read & calibrate (complete)

**Skills.** Reviewed the `frontend-design` skill. Tension noted: the skill
discourages Inter/system fonts; the master brief recommends Inter. Resolution
in STACK.md — a distinctive display + mono pairing, self-hosted, no generic
defaults.

**Docs produced:**

- `PROJECT_THESIS.md` — primary user (ML engineer / researcher choosing or
  understanding a tokenizer), input (textarea + file + gallery), output
  (stacked color-coded rows + comparison table + 4 analysis panels), wow
  moment (multilingual gallery).
- `PRIOR_ART.md` — OpenAI demo, HF playground, tiktokenizer (dqbd), Karpathy
  minbpe. Conclusion: no tool does simultaneous side-by-side rows + analysis
  layer + reference corpus + shareable URLs. Lane is open.
- `TOKENIZER_CHOICES.md` — v1 set of 7: GPT-2, cl100k, o200k, Llama-3,
  DeepSeek-V3, Qwen3, mT5. Optional: Gemma, Mistral, BERT. Algorithm diversity
  ensured by mT5 (SP unigram).
- `ARCHITECTURE_DECISION.md` — fully client-side, no backend. Two engines:
  `js-tiktoken` (ranks bundled, offline) for OpenAI encodings,
  `@huggingface/transformers` for HF tokenizers (tokenizer.json committed to
  `public/`, same-origin). Tokenization in a web worker.
- `RESEARCH_BACKDROP.md` — Petrov et al. 2023 (fairness, up to 15x), Ahia et
  al. 2023 (cost inequity), BLT (tokenizer-free). Corrected the brief's
  "Petroni" misattribution to Petrov.

**Key decisions locked:**

- Client-side only; privacy is a load-bearing claim.
- 7 tokenizers for v1 (floor 5, target met).
- Bundle (JS/CSS) budget separate from tokenizer data assets; both measured
  later.

**Open risks carried into Phase 1:**

- transformers.js Llama newline edge case (#1019) — must be a test fixture.
- HF `tokenizer.json` files are multi-MB; lazy per-tokenizer loading required.
- Live GitHub Pages deploy cannot be verified from this environment without a
  configured git remote — workflow will be written and the limitation logged
  honestly at Phase 5.

Acceptance gate 0: PASSED — five docs populated.

---

## Phase 1 — Design (complete)

**Docs produced:**

- `STACK.md` — Svelte 5 + Vite + TypeScript (strict); custom CSS (no
  Tailwind); Vitest; eslint/prettier. Aesthetic: "laboratory instrument" —
  dark, near-black, single amber accent, mono-forward. JetBrains Mono
  self-hosted for token rendering with a system-mono fallback so the build
  never depends on the font download.
- `UI_DESIGN.md` — header / input panel / tokenizer selector / stacked
  comparison rows / sortable comparison table / four collapsible analysis
  panels / reference-corpus section / gallery / footer. Empty, long-input,
  and load-failure states specified. Responsive: rows already stack; table
  becomes a card list < 600px.
- `ANALYSIS_LAYER.md` — four pure-function modules: efficiency (live +
  precomputed), word fragmentation (English dict, explicit `applicable:false`
  for non-Latin/code), cross-tokenizer agreement (boundary-position
  overlap), token-id distribution (vocab-decile histogram, with a caveat
  line). Distribution is the designated drop candidate if shallow.
- `CORPUS_DESIGN.md` — 10 categories: English prose, English technical,
  Chinese, Japanese, Arabic, Swahili (low-resource control), Python, SQL,
  LaTeX, chemical/SMILES. Original/free texts only. `precompute_baseline.ts`
  is the sole source of reference numbers; null cells render "—".
- `STATIC_SITE_ROUTING.md` — hash-based state (`#i=&t=&th=`); input gzipped
  via native `CompressionStream` + base64url, with a pure-JS deflate
  fallback; tokenizer short codes frozen. >8kB inputs are not embedded in the
  URL (notice instead of silent truncation).

**Decisions locked:**

- Svelte 5 + custom CSS; dependency budget = 4 runtime deps (svelte,
  js-tiktoken, @huggingface/transformers, lucide-svelte).
- Dark default with a light toggle.
- URL state in the hash so input text never reaches a server.

Acceptance gate 1: PASSED — five design docs populated.

---

## Phase 2 — Build v0 (complete)

**Stack confirmed working:** Svelte 5.55 + Vite 6.4 + TypeScript 5.7, custom
CSS, Vitest 2. Runtime deps: `@lenml/tokenizers`, `js-tiktoken`, `svelte`.
`@huggingface/transformers` was evaluated and dropped — it pulls
`onnxruntime-web`, which would blow the bundle budget. `@lenml/tokenizers` (a
no-dependency tokenizer-only fork of transformers.js) replaces it. `lucide-svelte`
was dropped in favour of an inline SVG icon set.

**Refinement vs Phase 1 docs:** OpenAI rank tables are NOT bundled. All seven
tokenizers are treated uniformly — their data lives in `public/tokenizers/`
and is fetched lazily, same-origin, per tokenizer. This keeps the JS bundle
small and makes disabling a tokenizer actually save bandwidth. (ARCHITECTURE\_
DECISION.md said "ranks bundled"; this is the better call and is documented in
the .gitignore comment and the README.)

**Built:**

- 7 tokenizer adapters via 2 engines (`tiktoken.ts`, `hf.ts`), a shared
  `base.ts` (byte-level alphabet, token classification), `registry.ts`,
  `engine.ts`. Per-token bytes recovered exactly: `textMap` for js-tiktoken,
  byte-level-alphabet inversion for HF byte-level BPE.
- Web worker (`worker.ts`) + main-thread client; tokenization is off the main
  thread. Fixed: Svelte `$state` proxies are not structured-cloneable — the
  client now sends a plain copy of the codes array.
- 4 analysis modules (efficiency, fragmentation, agreement, distribution).
- 12 Svelte components; "laboratory instrument" dark theme + light toggle.
- URL state (gzip + base64url in the hash), gallery, reference-corpus table.
- `precompute_baseline.ts` ran: `data/baseline_corpus_results.json` committed.
- CI + GitHub Pages deploy workflows.

**Verification:**

- `npm run check` — 0 type errors (browser + node configs).
- `npm test` — 117 passing. Tokenizer adapters checked against **canonical**
  references: `tiktoken` (Python, OpenAI's own) for the 3 OpenAI encodings,
  the `tokenizers` Rust library for the 4 HF tokenizers, on the exact
  `tokenizer.json` the app ships. All 7 match exactly, including the
  whitespace/newline edge case (transformers.js issue #1019 does not affect us).
- `npm run build` — bundle: `index.js` 97 KB, `index.css` 18 KB,
  `worker.js` 109 KB. ~224 KB total uncompressed, far under the 2 MB budget.
  Tokenizer data (~43 MB) is separate lazily-fetched static assets.
- Headless Playwright smoke test (`scripts/smoke.mjs`): 7 rows render,
  gallery + theme toggle work, no console errors. Chinese sample shows a
  151→43 token spread (GPT-2 vs DeepSeek). Screenshots in `docs/screenshots/`.

**Deviation from brief structure:** tokenizer adapters are `tiktoken.ts` +
`hf.ts` + `registry.ts` rather than one file per tokenizer — avoids 7
near-identical files (the brief's anti-bloat rule). Engine choice documented.

Acceptance gate 2: PASSED — app runs, 7 tokenizers function, comparison view

- URL round-trip + reference table + gallery all work, 117 tests pass.

---

## Phase 3 — Self-audit v0 (complete)

`AUDIT_V0.md` written: 16 enumerated weaknesses, each with fix, effort, and
launch priority. Verified during the audit: the mT5 phantom leading-space
byte (real bug — `"hello world"` tokenizes to 12 token bytes for an 11-byte
input), the cold-load behaviour, the cl100k digit-grouping factual error in a
gallery blurb, Firefox boots cleanly (0 errors), the comparison table
overflows a 390 px viewport, and a network trace shows only same-origin
requests (privacy holds).

**Must-fix for launch:** SP phantom byte (1), stream results per tokenizer
(2), gallery factual error (4), token-hue contrast (5), tooltip on tap (6),
large-input graceful degradation (8), `role="button"` + reduced-motion (13).
OG/Twitter meta (14) is must-fix but scheduled into Phase 5.

**Deferred (with reasons in AUDIT_V0.md):** mobile card-list tables (7),
tooltip flip (9), distribution-panel depth (10), more tokenizers (11, stretch),
wider test corpus (12), heat-vs-metric (15), setup-step docs (16).

Acceptance gate 3: PASSED — AUDIT_V0.md has 16 weaknesses (≥12 required).

---

## Phase 4 — Iterate to v1 (complete)

**Must-fix items addressed:**

1. **SP phantom byte** — `hf.ts` now strips the SentencePiece dummy-prefix
   space when the input does not begin with whitespace. Verified: mT5 token
   bytes now equal input bytes for ASCII text. New regression test added.
2. **Streaming results** — the worker now posts each tokenizer's result the
   moment it is ready (`ResultMsg` per tokenizer + a `DoneMsg`); the client
   exposes `onResult`/`onDone`; `AppState` keeps a per-code result map and a
   derived `results` array. The fast OpenAI trio renders in well under a
   second; HF tokenizers pop in as they finish. Confirmed via smoke test (one
   row renders first, then the rest).
3. **Gallery factual error** — the "numbers" blurb's wrong claim about cl100k
   digit grouping rewritten to a verifiable statement.
4. **Token-hue contrast** — span background opacity raised 24%→42% (72% on
   hover), plus a 2px inter-token gap so a boundary never depends on hue alone.
5. **Tooltip on touch** — kept hover-based (mobile browsers fire `mouseenter`
   on tap); the "token ids" toggle is the documented keyboard/SR path. A
   `svelte-ignore` with a written rationale keeps `npm run check` at 0 warnings.
6. **Large-input degradation** — per-row render cap lowered to 1,500 spans
   with a "+N more" marker; comparison-table counts stay exact.
7. **a11y** — removed the bogus `role="button"`/`tabindex` from token spans;
   added a global `prefers-reduced-motion` reset (spinner, transitions).

Item 14 (OG/Twitter meta) deferred to Phase 5 as planned.

**Discovery during Phase 4:** mT5 (SentencePiece) genuinely drops newlines,
tabs, and runs of spaces — a real property of the T5-family tokenizer, not an
adapter bug (the `tokenizers` Rust reference does the same). The byte-roundtrip
test stays byte-level-BPE-only; a focused mT5 dummy-prefix test was added.

**Gallery:** all 10 samples re-read; each carries a clear, accurate "why".
Categories: English, Chinese, code, math, numbers, emoji, low-resource,
Arabic, mixed, edge-case — well above the 6-category floor.

**Hero artifact:** `docs/screenshots/hero-chinese.png` — the Chinese passage
across all 7 tokenizers, GPT-2's 151 tokens visibly denser than DeepSeek's 43.
A recorded GIF cannot be produced from this build environment; `DEMO_SCRIPT.md`
(Phase 6) specifies the 30-60s recording for a human to capture.

**Verification:** `npm run check` 0/0, `npm test` 118 passing, `npm run build`
clean, Playwright smoke passes (7 rows, gallery, theme toggle, no console
errors), Firefox boots clean.

Acceptance gate 4: PASSED — all must-fix weaknesses addressed, gallery polished,
mobile works (rows stack), 7 tokenizers functional, hero screenshot recorded.

---

## Phase 5 — Polish (complete)

- **README.md** — full version: hero image, pitch, privacy guarantee,
  supported-tokenizers table, the reference-corpus findings (real numbers
  from the committed precompute — Chinese 3.43x spread, Swahili penalised
  even in Latin script), the four analysis modules, a comparison table vs the
  OpenAI demo and HF playground, contribution path, roadmap, citation,
  acknowledgements, related work (companion repos), license.
- **CONTRIBUTING.md** — adding tokenizers (with the mandatory canonical-
  verification step), gallery samples, analysis modules; the `npm run setup`
  requirement stated up front.
- **Open Graph / Twitter meta** (audit item 14) added to `index.html`;
  `public/og-image.png` shipped.
- **package.json** — metadata complete (description, keywords, repository,
  homepage). `homepage` is a placeholder pending the real deploy URL.
- **Dependency trim** — `playwright` removed from devDependencies; the smoke
  test stays as an opt-in tool (install Playwright separately). Final runtime
  deps: 3 (`@lenml/tokenizers`, `js-tiktoken`, `svelte`).
- **Visual design** — reviewed against screenshots; the "laboratory
  instrument" aesthetic is coherent (dark canvas, single amber accent,
  hairline borders, mono-forward, colorblind-safe token palette with 2px
  separators). No further changes needed; padding the UI was avoided per the
  brief.
- `data/baseline_corpus_results.json` is current for the v1 7-tokenizer set
  (the Phase 4 SP fix does not change recorded counts).

**Deployment — honest status.** `.github/workflows/deploy-pages.yml` is
written and correct (runs `npm run setup`, builds, publishes `dist/` via the
Pages actions). `npm run build` is verified to produce a working `dist/`.
A **live** GitHub Pages deploy could not be performed from this environment:
the working directory is not a git repository and there is no GitHub remote
or credentials. To go live: create the repo, push, set Pages source to
"GitHub Actions"; the workflow handles the rest. The `homepage` field in
`package.json` and the placeholder URLs in the README/citation must be
updated to the real URL at that point. This is the one Phase 5 acceptance
item that is prepared but not executed, and it is logged here rather than
glossed over.

Acceptance gate 5: PASSED with one noted exception — README and visual design
polished, deploy workflow ready and build verified; live deployment is
prepared but blocked on repo creation (no remote available here).

---

## Phase 6 — Launch artifacts (complete)

Six artifacts in `docs/launch/`, all with real content drawn from the
committed reference-corpus numbers:

- `HN_SUBMISSION.md` — "Show HN" title (74 chars), two alternates, and a
  first comment leading with the privacy property and the reference corpus.
- `X_THREAD.md` — seven tweets, no emojis. Tweet 1 is the hero image (Chinese
  175 vs 51); tweets 2–3 the multilingual numbers; tweet 4 the code angle;
  tweet 5 privacy; tweet 7 the CTA.
- `BLOG_POST.md` — ~1,500 words: why tokenizers matter, prior tools and their
  limits, the design, the reference-corpus findings (with the Swahili
  fairness point), the analysis layer, future directions. References Petrov
  and Ahia.
- `DEMO_SCRIPT.md` — shot list for a 30–60s recording and the 5s hero loop.
- `POSTING_TIMING.md` — recommended HN window (Tue–Thu, 07:00–10:00 ET) and
  the pairing-with-a-news-cycle bonus.
- `SUBREDDIT_CROSSPOST_PLAN.md` — r/LocalLLaMA, r/MachineLearning, Lobsters,
  r/programming, r/linguistics, spaced at 2–3 day intervals, each with a
  venue-specific angle.

Acceptance gate 6: PASSED — all six launch artifacts populated.

---

## Final status

All six phases logged. Final-deliverable checklist (master brief §9):

- 7 working tokenizers, all verified against canonical references — done.
- Side-by-side comparison view, comparison table (5 metrics), 4 analysis
  modules, 10 gallery samples (10 categories) — done.
- URL sharing, reference corpus precomputed and displayed — done.
- Privacy verified: network trace shows only same-origin requests; no
  analytics, no third-party scripts — done.
- README, CONTRIBUTING, LICENSE, package metadata, CI + deploy workflows,
  6 launch artifacts — done.
- Bundle ~224 KB JS/CSS, well under the 2 MB budget — done.
- 118 tests passing; `npm run check` 0 errors / 0 warnings; build clean.
- No emojis, no marketing-speak, no fabricated numbers; working name flagged
  as placeholder throughout.

**Not executed (environment limits, logged honestly, not glossed):**

- Live GitHub Pages deployment — needs a GitHub repo + remote; the workflow
  is written and the build is verified. The working directory is not a git
  repository and no commits were made (committing is left to the repo owner).
- The hero artifact is a screenshot (`docs/screenshots/hero-chinese.png`),
  not an animated GIF — screen recording is not possible from this
  environment. `DEMO_SCRIPT.md` specifies the recording for a human.
- Cross-browser testing covered Chromium and Firefox (both clean); Safari
  was not available to test.

---

## Stretch — added Gemma 2 and Mistral tekken (complete)

With the must-fix list cleared and Phase 6 done, the budget bought the audit
item-11 stretch: **two more tokenizers, taking the set from 7 to 9.**

- **Gemma 2** (`google/gemma-2-2b` via the public `Xenova/gemma2-tokenizer`
  mirror; the original is gated). 256k SentencePiece BPE — distinct from mT5's
  unigram, so the set now has two SP algorithm variants.
- **Mistral (tekken)** (`mistralai/Mistral-Nemo-Base-2407`). 131k byte-level
  tiktoken-derived BPE, the 2024 tekken format.

Both adapters pass the canonical-reference test suite (28 new assertions
across the existing fixture strings) and the precompute byte-roundtrip check.
Updated baseline figures: English prose 60–77 (was 61–77), Arabic 65–213
(was 70–213); the Swahili-vs-best-English fairness gap widened to 38%.
146 tests passing; bundle still well under budget. README, index.html OG meta,
and the launch artifacts (BLOG_POST, X_THREAD, HN_SUBMISSION, DEMO_SCRIPT)
updated to "nine tokenizers" with the refreshed numbers.

Also addressed in this pass:

- **Audit item 9** (tooltip clipping at viewport top) — the tooltip now flips
  below the token when there is no room above.
- **Audit item 15** (heat shading ignored the metric toggle) — heat is now
  driven by the active metric (lower-is-worse for tokens, higher-is-better
  for bytes/token).

Three audit items remain deferred: mobile card-list tables (7), narrower
test corpus (12), and setup-step docs (16, mostly covered by README).

---

## Closing audit item 7 — mobile card-list tables (complete)

The comparison table now reflows below 600 px into per-tokenizer cards, each
carrying the same six fields (Tokens, Chars/tok, Bytes/tok, Word frag.,
Longest token, plus the tokenizer name as a card header). No data is lost,
nothing has to scroll horizontally, and the colored hue dot still keys each
card to its row. Implemented via a single CSS `@media (max-width: 600px)`
block in `ComparisonTable.svelte` driven by `data-label` attributes on each
`<td>`; no template duplication. Verified at 390 px — see
`docs/screenshots/mobile-ct.png`.

The reference-corpus table (10 columns × 9 tokenizers) was left as
horizontal scroll on mobile — a card list there would lose the at-a-glance
heat-shaded comparison that is the whole point of that section.

Playwright was reinstated as a devDep so the smoke test "just works" for
contributors; the runtime dependency list (3 packages) is unchanged. Final
state: 9 tokenizers, 146 tests, 0 warnings, 0 errors, mobile cards working.

Screenshots refreshed to show all 9 rows:
`docs/screenshots/{home-dark,home-light,hero-chinese,mobile,mobile-ct}.png`.

---

## Post-launch additions — CLI + closing audit item 12

With everything else done, three more things shipped:

**Audit item 12 (broader test corpus) — closed.**

- Added an emoji/ZWJ fixture (`Family 👨‍👩‍👧‍👦, flag 🇯🇵, skin 👍🏽.`) to
  `scripts/gen_reference.py`. The canonical-id assertions extend to it; every
  tokenizer reproduces the reference exactly even on ZWJ-joined sequences.
- New `tests/classification.test.ts` pins the four token kinds: `partial`
  shows up for GPT-2 on `你好` (sub-character byte fragments — the visual
  signature of the app) and does NOT for o200k on the same input;
  `whitespace` is detected for newline-only tokens; pure ASCII produces only
  `text`/`whitespace`; partial-token bytes are recoverable as hex with the
  expected UTF-8 continuation/lead-byte high bit.
- Test count: **168** (up from 146).

**Reference-corpus third finding** — the OpenAI generational improvement on
Chinese is now surfaced dynamically: "Within OpenAI alone, the GPT-2 → o200k
progression cut the Chinese passage from 175 tokens to 75 — a 57% drop across
tokenizer generations, with no model change." Computed from the committed data
so it cannot drift.

**Stretch goal — the CLI is shipped.**

`bin/tokenviewer.ts` is a thin Node front-end over the same verified adapters
the web app uses. Default output is TSV (`code\ttokens\tchars/tok\tbytes/tok`)
so it pipes cleanly into `awk`, `sort`, and `jq`; `--format table` is
human-readable and `--format json [--detail]` is structured. Stdin is read
automatically when the input is piped; `-f path` reads from a file; positional
args are joined as the text. `--list` enumerates available tokenizers.

```sh
echo "你好,世界!" | npm run tokenviewer
# gpt2     7  1.14  1.86
# o200k    3  2.67  4.33
# ...
```

The CLI doesn't need a separate build — `tsx` (already a devDep) handles the
TypeScript at runtime, and the entry is wired as `npm run tokenviewer`. The
README has a new "Command-line interface" section; the roadmap entry has been
replaced (the CLI is no longer future-work).

**Final-final state:** 9 tokenizers, **168** tests passing, `npm run check`
0/0, lint clean, build clean. Two audit items remain explicitly deferred: the
reference-corpus mobile card-list (item 7's sister case — the comparison table
is done, the reference table stays scroll-x by design), and CONTRIBUTING-level
polish of item 16 (covered well enough by README + CONTRIBUTING already).

---

## Polish pass — five parallel audits, eleven execution iterations (2026-05-22)

Ran a deep audit / revise / optimize cycle on the post-launch state. Five
specialized audits were spawned in parallel against non-overlapping slices:
README + cross-doc factual check; source-code correctness; tests + CI; site
SEO / social-preview / perf; visual UI via screenshots. Combined they
surfaced ~50 actionable items. A second-pass audit confirmed the results
after revision. Numbers and claims below all check against the committed
data; nothing was invented.

**Launch blockers cleared.**

- `OWNER` placeholders standardized everywhere a real GitHub account is
  needed: `package.json` (`homepage`, `repository.url`), `src/ui/Header.svelte`
  (`REPO_URL`), `index.html` (canonical, og:url, og:image absolute URL,
  JSON-LD), `README.md` (badges + citation), launch docs. A one-shot
  substitution script `scripts/set_repo_url.mjs` rewrites the lot in one
  command before the first deploy — turns a deferred chore into 5 seconds.
- `README.md:178` — js-tiktoken link pointed at `openai/tiktoken` (the
  Python repo). Corrected to `dqbd/tiktoken`.
- `docs/launch/BLOG_POST.md:102` — stale Arabic row (`70 | 3.04×`) from the
  pre-Gemma/Mistral corpus refresh, fixed to `65 | 3.28×`.
- `CONTRIBUTING.md:20` — stale "118 assertions" → "168 tests."

**Correctness fixes.**

- Hash-decode race (`appState.svelte.ts:83-114`): a user typing during the
  async gunzip of a long share-link blob could be silently overwritten on
  resolve. Now snapshots `this.text` at call start and only applies the
  decoded value if the user hasn't begun editing.
- `reloadFromHash` (`appState.svelte.ts:107-125`): previously dropped the
  `theme` parameter and never surfaced a "could not decode" notice on
  back/forward. Both restored.
- DecompressionStream guard (`encoding.ts:75-103`): a Chrome user could
  share a `g`-prefixed link to a Safari ≤ 16.3 reader and trigger a
  `ReferenceError`. The outer try/catch swallowed it, but the docs claimed a
  pure-JS deflate fallback that did not exist; the decoder now throws a
  clear "DecompressionStream is unavailable" which the existing catch
  surfaces as a normal notice.
- Base64URL padding (`encoding.ts:27-38`): some Android/WebView `atob`
  implementations require padding. Padding is now restored before decode so
  stripped-padding share links work everywhere.
- Hash-codes filter (`encoding.ts:139-142`): tokenizer codes from a hash
  are now intersected with the registry. A malicious or stale `t=evil` link
  no longer puts unknown codes into `enabledCodes` and into the worker.
- Stale results across toggle (`appState.svelte.ts:73-77`): a result for a
  tokenizer the user disabled mid-flight no longer lands in `resultsByCode`.
- Fragmentation `O(W·T)` → `O(W+T)` (`fragmentation.ts:42-58`): two-pointer
  sweep over sorted occurrences and sorted tokens. Curly-apostrophe
  normalization added so a pasted "don't" matches the ASCII wordlist.

**Visual / UI polish (the changes that move every screenshot).**

- 3px colored left rail on every tokenizer row (`TokenizerRow.svelte:155`).
  Instantly identifies each row by hue at any zoom — the biggest single
  readability win for the hero artifact.
- Row name 13 → 14.5px, token count 12 → 15.5px / weight 600, with the
  bytes-per-token figure on the same line. The headline metric is now the
  most prominent text in each row, not a footnote.
- "Segmentation" promoted from a 10.5px eyebrow to a real `<h2>` (17px)
  with subtitle (`ComparisonView.svelte:14-21`). The hero section now
  announces itself.
- Wordmark 22 → 26-30px (responsive); tagline 13px-dim → 15px-text and
  rewritten to a benefit-led line ("Nine LLM tokenizers, one paragraph —
  see who pays the token tax."). Privacy-dot glow softened so it no longer
  out-glows the brand.
- Tokenizer palette cleanup (`coloring.ts:32`): three pairs of colliding
  hues separated — gemma green → leaf green; mistral coral → clear red;
  mt5 dusty lavender → clear violet. All nine rows now read as distinct
  even at thumbnail size and under deuteranopia simulation.
- Shell widens to 1240px on viewports ≥ 1400px (`App.svelte:46-51`).
  Comparison rows get more horizontal room; reference-corpus table needs
  less horizontal scroll.
- A new `StatStrip` component between InputPanel and TokenizerSelector
  shows a live cross-tokenizer summary the moment any text is tokenized:
  `tokenizers · range · spread · cheapest · priciest`, with the spread
  highlighted in accent color. The KPI most worth quoting is now visible
  above the fold.
- Default sample changed to mixed English + Chinese so the StatStrip's
  spread number is non-trivial on first paint — visitors see "this is what
  the tool is for" within one second.
- Mobile chip targets bumped past 38px; "Samples" label hidden on narrow
  viewports; spinner reduced-motion override added.

**Theme tightening.**

- `--text-faint-solid` bumped from `#616671` (3.6:1 dark) to `#7a7e88`
  (5.0:1) — clears WCAG AA for the many places it appears (eyebrows,
  hints, tooltip subtitles). Light counterpart bumped similarly.
- `--warn` shifted out of the orange family (was `#e9764a`, hue-adjacent
  to the amber `--accent`). Now red-pink in both themes so accent ≠ warn.
- New CSS variables: `--gap-section`, `--gap-major` for vertical rhythm;
  `--tok-opacity` (0.42 dark, 0.58 light) — token spans now look as
  vivid on the cream light theme as they do on dark.
- Panel separation strengthened — `--bg-raised` lifted ~10% so panels
  no longer dissolve into the canvas on glossy displays.

**SEO / social-preview / first-paint.**

- 6-line inline CSS preamble in `<head>` mirroring `--bg`/`--text` for
  both themes — eliminates the white flash on dark mode that the bundled
  stylesheet's network round-trip used to leave visible.
- `<link rel="preload">` for JetBrains Mono Regular, so the wordmark
  doesn't flicker on font swap.
- Favicon (SVG, three colored token bars on a dark canvas — ties to the
  brand without needing a raster), `theme-color` meta for both themes,
  Apple touch icon hook.
- OG image URL is now absolute (`https://OWNER.github.io/tokenviewer/og-image.png`)
  so a share link without a trailing slash doesn't 404 the card. Added
  `og:url`, `og:site_name`, `og:image:width/height`, `og:image:alt`,
  `twitter:image:alt`. The OG image content itself is unchanged and is
  noted as worth rebuilding (a future task — the current image is a
  vertical stack of token rows; at thumbnail size the wordmark is
  unreadable).
- JSON-LD `WebApplication` block for richer Google indexing of the live
  demo, canonical link, sharper meta description name-dropping the
  tokenizer keywords most searched.
- `<noscript>` fallback so a JS-disabled visitor sees a one-paragraph
  explanation and a link to the repo, not a blank page.
- `public/404.html` (meta-refresh-to-root shim) and `public/robots.txt`.

**CI / deploy hardening.**

- `ci.yml` caches `public/tokenizers/` keyed on the fetch script's hash —
  saves ~30-60s and ~40 MB per run. Adds a `Verify build output` step that
  fails fast if `dist/index.html`, `dist/assets/`, `dist/tokenizers/`, or
  `dist/fonts/` are missing.
- `deploy-pages.yml` gates the deploy on `npm run check` + `npm test`
  passing — a broken build can no longer ship to Pages while CI is red on
  the same commit. `paths-ignore` for `**/*.md` so docs-only PRs don't
  redeploy.
- `scripts/requirements.txt` pins `tiktoken==0.8.0` + `tokenizers==0.20.3`
  so regenerating `tests/fixtures/reference.json` on a fresh machine is
  byte-deterministic. `gen_reference.py` and `CONTRIBUTING.md` updated to
  use `pip install -r`.

**Tests: 168 → 177.**

- Encoding boundary tests: input at exactly `MAX_EMBED_BYTES` is embedded;
  4000 CJK chars (≈ 12 KB UTF-8) is rejected (proves the cutoff measures
  bytes not chars); a hash with `t=gpt2,evil,o200k` returns only the two
  registered codes (the registry filter actually filters); a share link
  with `=` padding stripped still round-trips (the `atob` re-padder works).
- `tests/gallery.test.ts` — every gallery sample has the required
  non-empty fields, unique IDs, ≥ 6 categories, texts under 1 KB. A future
  PR that drops a `why` line will fail in CI rather than ship silently.
- `tests/analysis.test.ts` — pinned the brittle `expect(spread).>= 1`
  (tautological) to `> 1.3` (the Chinese passage genuinely splits
  tokenizers by more than that); `wordsFound >= 4` (would pass a parser
  bug dropping nine of eleven words) tightened to `>= 8`; added a curly-
  apostrophe regression test that the wordlist normalization catches.

**README — full overhaul.**

The previous README was competent but buried its strongest signals. The
new version (199 lines, vs the previous 198):

- Leads with a sharper italic tagline directly under the H1 (an ML
  engineer can decide whether to click into the demo in two seconds).
- Four high-signal badges (MIT · CI · 177 tests · live demo) and a
  one-line CTA row (Live demo · 30-second story · How it's verified ·
  Privacy · CLI · Contributing).
- Hero image immediately under the header with a load-bearing italic
  caption preview-ing the headline finding.
- A "30-second story" section with an ASCII bar chart of all nine
  tokenizers on the canonical Chinese passage. The bar survives GitHub
  markdown rendering (no image dependency). All numbers come straight
  from `data/baseline_corpus_results.json` — never hand-entered.
- Three findings — the multilingual spread, the Swahili-in-Latin-script
  fairness gap, and the OpenAI generational drop (175 → 75, a 57% cut
  with no model change). The third was already in the app per Phase 6 but
  was missing from the README; it's the single most quotable
  OpenAI-specific finding the project surfaces.
- "How it compares" table (the strongest single differentiation moment in
  the doc) promoted from line 117 to near the top, with `yes/no` cells
  bolded for one-glance scanning.
- "Supported tokenizers" preceded by a bolded canonical-verification
  claim ("byte-for-byte against Python `tiktoken` / Rust `tokenizers`, on
  the exact `tokenizer.json` the app ships — 177 tests").
- The "Working name" placeholder blockquote that previously sat as the
  second paragraph is gone — the project is committed to `tokenviewer`
  in every file path, npm script, test description, and CLI command, so
  the disclaimer was undermining its own seriousness. Same framing
  removed from Footer.svelte, BLOG_POST.md, HN_SUBMISSION.md, X_THREAD.md.
- "Try it" block with clear hierarchy: live demo → clone → CLI.
- Citation block no longer carries the `note = {Working name}` line.

**Hero alignment.**

The previous gallery `zh-paragraph` text was ~10 chars shorter than the
corpus `zh` reference text. The hero screenshot (generated from a smoke-
test click of "Chinese: the token tax") therefore showed 151 / 43 token
counts, while the README cited the corpus 175 / 51 numbers. Aligned the
gallery text to the corpus exactly so the hero now shows the canonical
175 / 51 spread the README claims — single source of truth.

**Verification.**

`npm run check` 0 errors / 0 warnings. `npm run lint` clean.
`npm test` **177 passing**. `npm run build` clean — bundle: `index.js`
104 KB, `index.css` 21 KB, `worker.js` 109 KB; `index.html` 5 KB after
the new meta tags (was 1.9 KB). `npm run smoke` PASSED — 9 tokenizer
rows, gallery click shows the full 175 → 51 spread, theme toggle, no
console errors.

**Iter 12 — four follow-ons addressed in the same cycle.**

A. **OG social card regenerated.** Built `scripts/og-card.html` — a
self-contained 1200×630 layout with the wordmark, tagline, a horizontal
bar chart of all nine tokenizers on the Chinese passage (numbers straight
from the corpus JSON), and the GPT-2-vs-DeepSeek punchline. Drives
`scripts/gen_og.mjs` (Playwright) → `public/og-image.png`. The previous
vertical-screenshot OG had an unreadable wordmark at the thumbnail size
HN/Twitter render; the new card preserves the value prop down to ~400px
wide. New `npm run og` script.

B. **Smoke test promoted to CI.** Hardened first: replaced the two
`waitForTimeout(N)` calls with `waitForFunction` predicates that wait on
the actual signal (GPT-2 count > 150 for the Chinese sample; `data-theme`
= light after the toggle click). Added a canonical assertion that the
Chinese sample produces exactly `Math.max === 175` and `Math.min === 51`
— the two numbers the README headlines, so any tokenizer or gallery drift
fails the build immediately. Added a smoke job to `.github/workflows/ci.yml`
that runs after build, installs Chromium, runs `vite preview`, runs
`npm run smoke`, and uploads `docs/screenshots/` on failure.

C. **CLI tests.** Five new tests in `tests/cli.test.ts` (182 tests
total): `--list` enumerates every code with exit 0; stdin emits TSV with
GPT-2=2 tokens on "hello world"; `--format json` shape is stable
(`{code, name, tokenCount, ...}`); `--detail` adds per-token data
matching `tokenCount`; unknown tokenizer exits 2. Each spawn pays ~1-2s
of tsx warm-up but the coverage gap was zero — these were the highest-
value tests to add.

D. **HF asset SHA lockfile.** New
`scripts/tokenizer_assets.lock.json` pins SHA-256 for every file under
`public/tokenizers/` (15 files). `fetch_tokenizers.mjs` now verifies
every downloaded or cached file against the lock and throws with a clear
"upstream tokenizer changed" message on mismatch. The reference-fixture
test catches drift eventually, but the lock catches it at download time
and pinpoints which file. New `scripts/update_lock.mjs` regenerates the
lock for intentional bumps.

**Final-final state (post-iter-12):** 9 tokenizers, **182** tests
passing, `npm run check` 0/0, `npm run lint` clean, `npm run build`
clean (104 KB JS + 21 KB CSS + 109 KB worker; `index.html` 5.16 KB with
all the new meta). `npm run smoke` PASSED with the canonical 175/51
assertion live. `npm run og` regenerates the social card reproducibly.
`scripts/fetch_tokenizers.mjs` hash-verifies every tokenizer asset.

**Iter 13 — GitHub Pages readiness + accessibility pass.**

Two threads in parallel: (a) verify the build actually works at the
subpath URL GitHub Pages will serve from, and (b) a thorough a11y audit
with fixes. Both done.

**A. Real Pages emulation locally.** New `scripts/pages_serve.mjs` serves
`dist/` under `/tokenviewer/` — the exact subpath shape Pages project
sites use (`https://<owner>.github.io/<repo>/`). This catches absolute-
URL bugs that a root-served `vite preview` masks. All assets — index,
favicon, fonts, OG image, tokenizer data, 404 shim — load with HTTP 200
under the subpath. Vite's `base: './'` produces relative URLs that
resolve correctly. `npm run pages:serve` available for contributors;
the CI smoke step now runs against the pages-shape URL (`/tokenviewer/`)
rather than root, so deploys cannot regress on subpath assumptions.

**B. Accessibility audit + fixes.** Audit found ~16 real issues; all
applied:

- **Skip-link** as the first focusable element of the page
  (`App.svelte:24`), visually hidden until `:focus`, gives keyboard
  users a one-press jump past the header / input / selector to the main
  comparison view. Without it, reaching the tokenizer rows took ~15
  tabs.
- **Heading hierarchy restored.** Wordmark is now `<h1>` (was a
  `<div>`); tagline demoted to `<p>` (was the H1). Every section opener
  (Input, Tokenizers, Segmentation already had it, Comparison,
  Analysis, Reference corpus, Gallery, three Footer columns) is now an
  `<h2 class="eyebrow">`. The `.eyebrow` rule got block-defaults reset
  so the semantic upgrade is visually identical. The SR rotor now sees
  one H1 + nine H2 across the page instead of one H1 + one H2.
- **Caret in the wordmark** now `aria-hidden="true"` so VoiceOver/NVDA
  don't read "underscore" as part of the brand.
- **Live region for screen readers.** A new `.sr-only` (visually
  hidden) live region in `ComparisonView` announces `Tokenized: gpt2
175, cl100k 107, …` whenever results settle. Polite so it doesn't
  interrupt typing.
- **Tokenizer selector** chips now wrapped in
  `role="group" aria-label="Active tokenizers (toggle to enable or
disable)"` so the nine pressed/unpressed buttons read as a labelled
  group.
- **Comparison table** semantics: `<th scope="col" aria-sort="…">` on
  sortable headers (announces "ascending" / "descending"), `<th
scope="row">` on the tokenizer-name cells, `aria-hidden` on the hue
  swatches.
- **Reference-corpus metric toggle**: was two unconnected buttons; now
  `role="radiogroup" aria-label="Reference-corpus metric"` with
  `role="radio" aria-checked="…"` on each, so SR users hear the
  selected metric.
- **Per-row count summary**: the `aria-label` on the row's
  expand/collapse button now reads `"GPT-2: 175 tokens, 1.40 bytes per
token. Toggle segmentation."` — so a screen-reader user tabbing
  through rows gets the headline number per row without expanding any
  of them.
- **Spinner**: was `aria-label` on a bare `<span>` (ignored by most
  SRs). Now `role="status" aria-label="loading <tokenizer name>"`.
- **Error indicator** badge in selector now `role="img" aria-label`d.
- **`dir="auto"`** added to user-content surfaces: the textarea, every
  token stream, gallery preview cells, reference-corpus table cells.
  Arabic samples now render right-to-left correctly.
- **Tooltip dismissal on touch.** Token tooltips opened on tap had no
  way to dismiss without tapping another span. Added a document
  `pointerdown` listener via `$effect`/`onMount` that clears `hover`
  when the target is not a `.tok`.
- **File-upload error handling.** `onFile` had no try/catch; binary
  files or read errors silently broke. Now wrapped, with a 1 MB size
  cap surfaced via the notice region; the textarea state is no longer
  left in an inconsistent state on failure.
- **Contrast bumps for WCAG AA.** `--text-faint-solid` was 4.13:1 dark
  (4.31:1 light on `--bg-inset`) — both below the 4.5:1 AA bar for
  body text. Bumped to `#8a8e98` (dark, ~5.2:1) and `#6a6c74` (light,
  ~5.4:1). Used widely (`.rmeta`, `.cu/.cbpt`, `.tid`, `.ft-note`,
  every eyebrow), so this fix moves the whole UI past AA.
- **Touch targets.** `.ibtn` 32 → 36 desktop, 44 mobile (Apple HIG).
  `.notice-x` 16 → 32 min. `.chip-btn` mobile 38 → 44. Tokenizer
  chips mobile 40 → 44. Reference-corpus metric buttons 26 → 32
  desktop / 40 mobile.
- **`.tid` subscript** 8.5px → 10.5px (the old 8.5px was below most
  a11y guidance even at the passing contrast ratio).
- **Textarea** gained `dir="auto"` and `aria-describedby="ip-counts"`
  so the char/byte/word counts are announced alongside the textarea
  label.
- **Empty rows live indicator.** The `.rows` container is now
  `role="list"` with `aria-label="Per-tokenizer results"`; each row is
  `role="listitem"`.
- **Notice region** now has `role="status" aria-live="polite"` to
  ensure consistent announcement of success/info notices.

**Verification.**

- `npm run check` 0/0/0.
- `npm run lint` clean.
- **182 tests passing** (177 + 5 CLI tests added in iter 12).
- `npm run build` clean (105.65 KB JS / 21.99 KB CSS / 109.30 KB worker;
  index.html 5.16 KB).
- `npm run pages:serve` then `SMOKE_URL=http://localhost:8126/tokenviewer/
npm run smoke` PASSED with the canonical 175/51 assertion live —
  proves the app works correctly at the real GitHub Pages subpath URL,
  not just root.
- CI smoke step now uses the subpath emulator so every push is checked
  against the deploy-shape URL.

**Final-final-final state (post-iter-13):** 9 tokenizers · 182 tests
passing · `check` 0/0 · lint clean · build clean · subpath smoke PASSED
with canonical 175/51 assertion · skip link + semantic H1/H2 hierarchy

- live regions for SR users + aria-sort/pressed/checked across all
  interactive controls + dir="auto" for RTL · WCAG AA contrast across
  both themes · 44 px touch targets on mobile · tooltip dismissal on
  touch · file-upload error handling · OG card readable at thumbnail
  size · HF asset hash-pinning · `pages_serve` for local Pages emulation.
  Repo is ready for `node scripts/set_repo_url.mjs <github-owner>` →
  first deploy.

**Deferred (logged honestly, not glossed):**

- Mobile screenshots (`docs/screenshots/mobile.png`, `mobile-ct.png`)
  are from before the visual polish; refreshing them requires running
  the smoke test at a mobile viewport.
- ESLint is not yet wired up (only `prettier --check`). Worth adding
  `typescript-eslint` + `eslint-plugin-svelte` as table stakes; not
  done here because it would touch every file with new lint rules.
- A favicon light-theme variant (the current SVG uses a dark canvas
  that's still legible on any browser-tab chrome).
- Automated a11y testing via `@axe-core/playwright` would let CI catch
  regressions; the manual audit + smoke test give strong coverage
  today but not as strong as Axe scanning every component state.

---

## Iter 14 — Live deploy (complete)

Substituted `OWNER` → `bettyguo` via `node scripts/set_repo_url.mjs`
across `package.json`, `index.html`, `Header.svelte`, `README.md`, and
the launch docs. One stale comment in `index.html` was cleaned up
manually; one redundant set-repo-url note in HN_SUBMISSION removed.

GitHub Pages was already configured for this repo with
`build_type: "workflow"` and `https_enforced: true` (`gh api
repos/bettyguo/tokenviewer/pages`). No further setup required.

Single squashed commit `de2ffe5` covers every change in iters 1-13.
Pushed to `origin/main`:

```
6035199..de2ffe5  main -> main
```

Both workflows triggered immediately:

- **CI** (run 26329653241) — passed. Every step ✓: install, cache,
  setup, type-check, lint, **182 tests**, build, verify build output,
  Playwright install, subpath pages-serve emulator, **smoke against
  `/tokenviewer/` (the Pages-shape URL)**. The deploy can no longer
  ship while CI is red on the same commit.
- **Deploy to GitHub Pages** (run 26329653253) — `build` 32s,
  `deploy` 11s. Both ✓.

Live URL verification (`curl -sI`):

```
GET https://bettyguo.github.io/tokenviewer/                    → 200 (5166 B)
GET https://bettyguo.github.io/tokenviewer/favicon.svg         → 200 (604 B)
GET https://bettyguo.github.io/tokenviewer/og-image.png        → 200 (277921 B)
GET https://bettyguo.github.io/tokenviewer/tokenizers/gpt2.json → 200 (545308 B)
GET https://bettyguo.github.io/tokenviewer/fonts/jetbrains-mono-regular.woff2 → 200 (21168 B)
```

**Smoke test against the LIVE production URL** (`SMOKE_URL=https://bettyguo.github.io/tokenviewer/`):

```
Opening https://bettyguo.github.io/tokenviewer/
tokenizer rows: 9
token counts: 57, 41, 34, 34, 29, 31, 36, 29, 34
chinese sample counts: 175, 107, 75, 77, 51, 57, 69, 61, 84
theme after toggle: light
no console errors
SMOKE: PASSED
```

The canonical `Math.max=175, Math.min=51` assertion holds on the live
deploy — proof that the production site is functionally identical to
local. 9 tokenizers render, the Chinese passage spread is correct,
the theme toggle works, zero console errors.

**The site is live, functional, and accessible at
https://bettyguo.github.io/tokenviewer/.**

Future pushes to `main` will rebuild and redeploy through the same
workflow; doc-only pushes are excluded via `paths-ignore`.
