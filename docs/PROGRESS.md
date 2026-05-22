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
