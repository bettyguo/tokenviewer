# ARCHITECTURE_DECISION

## Decision

**Fully client-side. No backend.** Every tokenizer runs in the browser. Text
never leaves the page. The site is static and deployable to GitHub Pages.

## Why client-side

1. **Privacy is a load-bearing claim.** "Your text never leaves the browser"
   is the headline differentiator over any server-backed tool. A backend
   breaks it.
2. **No operational cost or cold starts.** A static site on GitHub Pages is
   free and has no latency floor.
3. **Shareable URLs are trivial.** State lives in the URL; no server session.
4. **Instant feedback.** Tokenization is fast enough to run on every keystroke
   (debounced), with no round trip.

## Library mix

Two engines cover the whole default set:

### Engine A — `js-tiktoken` (OpenAI encodings)

- Pure JavaScript, ~200KB, maintained alongside OpenAI's interests.
- Handles `gpt2`, `cl100k_base`, `o200k_base` (also `p50k`, `r50k`).
- Critically: it ships the BPE rank tables as **importable JSON modules**
  (`js-tiktoken/ranks/cl100k_base`, etc.). Importing them statically means the
  ranks are bundled — **zero network calls, fully offline**. We do NOT use the
  lazy-loading `getEncoding()` path that fetches ranks from a CDN.
- WASM alternative `@dqbd/tiktoken` is faster on huge inputs but adds WASM
  loading complexity and a larger asset. Rejected for v1: js-tiktoken is fast
  enough inside a web worker for inputs up to ~100KB.

### Engine B — `@huggingface/transformers` (HF-format tokenizers)

- transformers.js. `AutoTokenizer.from_pretrained()` loads any HF tokenizer
  defined by a `tokenizer.json` (the fast/Rust-tokenizer JSON form). Covers
  Llama-3, DeepSeek-V3, Qwen3, mT5, Gemma, Mistral, BERT.
- We import only the tokenizer surface, not the model-inference runtime, so
  ONNX runtime / WASM model weights are never pulled in.
- **Asset hosting:** transformers.js by default fetches `tokenizer.json` from
  the HF Hub CDN. That is a third-party request — unacceptable for the privacy
  claim. We set `env.allowRemoteModels = false` and `env.localModelPath` to a
  **same-origin** path, and commit the `tokenizer.json` files under
  `public/tokenizers/<id>/`. A build/setup script
  (`scripts/fetch_tokenizers.mjs`) downloads them once from the Hub into
  `public/`. At runtime the browser only ever talks to its own origin.

### Considered and rejected

- **`@lenml/tokenizers`** — a no-dependency fork of transformers.js, tokenizer
  only. Attractive for bundle size, but less maintained and an extra trust
  surface. Kept as a documented fallback if transformers.js bloats the bundle.
- **A Python FastAPI backend** — see BACKEND*FALLBACK in the master brief.
  Only if a chosen tokenizer proves impossible client-side. Current assessment:
  not needed. SentencePiece, historically the risk, is handled because
  transformers.js consumes the \_converted* `tokenizer.json` (mT5, Gemma all
  publish one). If a future tokenizer has no `tokenizer.json` and no JS port,
  the policy is **drop it from v1**, not stand up a server.

## Bundle vs. data — the size budget

The <2MB target in the brief applies to the **JS/CSS bundle** (application
code + library code). It does NOT include tokenizer **data** files:

- BPE rank JSON for the OpenAI trio is bundled (counts toward budget; o200k
  ranks are the largest single contributor — measured in PROGRESS.md).
- HF `tokenizer.json` files are **static data assets** loaded lazily, per
  tokenizer, only when that row is enabled. They are same-origin fetches, not
  bundle. Llama-3 / DeepSeek / Qwen JSON are several MB each raw but compress
  well over HTTP gzip and are cached by the browser.

This split is stated honestly in the README so "<2MB bundle" is not
misleading. The audit (Phase 3) measures both numbers.

## Threading

Tokenization runs in a **web worker** so large inputs never freeze the UI
thread. The worker holds all tokenizer instances; the main thread posts text
and receives `Token[]` arrays. transformers.js and js-tiktoken both run in a
worker without issue.

## Runtime network profile (privacy audit target)

After first load, with all assets cached, a tokenization produces **zero**
network requests. First load fetches: the static bundle, then — lazily, as
tokenizers are enabled — same-origin `tokenizer.json` files. No analytics, no
fonts from third-party CDNs (fonts are self-hosted), no telemetry. Verified in
Phase 3 with the browser network panel.
