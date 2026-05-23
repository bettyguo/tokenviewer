# Contributing to tokenviewer

Thanks for considering a contribution. The most useful contributions are new
tokenizers, new gallery samples, and new analysis modules.

## Setup

```sh
npm install
npm run setup     # REQUIRED — downloads tokenizer data + fonts into public/
npm run dev
```

`public/tokenizers/` is not committed (~43 MB of vocabulary files), so
`npm run setup` must run once before the app works. Before opening a PR:

```sh
npm run check     # type-check (browser + node)
npm run lint      # prettier
npm test          # 177 tests, incl. canonical tokenizer verification
npm run build
```

CI runs all of these. Commits follow [Conventional Commits](https://www.conventionalcommits.org).

## Adding a tokenizer

The two engines — `tiktoken` (js-tiktoken) and `hf` (@lenml/tokenizers) —
already cover byte-level BPE and SentencePiece, so most tokenizers need no new
adapter code.

1. **Register it.** Add a `TokenizerSpec` to `src/tokenizers/registry.ts`. The
   `code` is a URL-safe short id and is **frozen once shipped** — shared links
   depend on it. Pick `engine: 'hf'` for a Hugging Face `tokenizer.json`.
2. **Wire the download.** For an HF tokenizer, add `code -> repo` to the `HF`
   map in `scripts/fetch_tokenizers.mjs`, then run `npm run fetch:tokenizers`.
3. **Verify it.** Add the tokenizer to `scripts/gen_reference.py`, run
   `pip install -r scripts/requirements.txt && python scripts/gen_reference.py`,
   and run `npm test`. The suite asserts the JS adapter reproduces the canonical
   token ids exactly. A tokenizer without this verification will not be
   merged — no mocked or unverified tokenizers (see the project's anti-pattern
   list in the master brief).
4. **Refresh the corpus.** Run `npm run precompute` to regenerate
   `data/baseline_corpus_results.json`.
5. Give it a distinct hue in `src/utils/coloring.ts` (`TOKENIZER_HUES`).

If a tokenizer has neither a `tokenizer.json` nor a JS port, the project
policy is to leave it out rather than add a server — privacy is load-bearing.

## Adding a gallery sample

Edit `data/gallery_samples.json`. A good sample makes one cross-tokenizer
difference obvious at a glance. Each entry needs a `title`, a one-line `why`
that is **factually accurate** (claims about tokenizer behavior must be
verifiable in the app itself), a `category`, and the `text`. Keep texts short
(roughly 100–300 characters) and original or freely licensed.

## Adding an analysis module

Analysis modules live in `src/analysis/` as pure functions
`(results, ...) => Analysis`. They must:

- not mutate the input `Token[]`;
- return a serializable object (so it can be snapshot-tested);
- handle the not-applicable case explicitly rather than emitting a misleading
  number (see `fragmentation.ts` for the pattern).

Add a test in `tests/analysis.test.ts` and a panel in `AnalysisPanels.svelte`.

## Scope and style

- TypeScript, strict mode. Custom CSS only — no CSS framework.
- No new runtime dependency without a clear justification; the bundle budget
  matters.
- No analytics, no third-party scripts, no telemetry — ever.
- No emoji in code, UI text, or docs.
