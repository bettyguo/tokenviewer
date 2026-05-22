# tokenviewer

An interactive, in-browser visualization of how 6+ popular LLM tokenizers
segment the same text, with cross-tokenizer efficiency analysis.

> **Working name.** `tokenviewer` is a placeholder — alternatives under
> consideration: `tokenscope`, `tokenlens`, `bpe-explorer`. Not yet committed.

![The shared Chinese passage tokenized across all seven tokenizers — GPT-2's
175 tokens are visibly denser than DeepSeek-V3's 51.](docs/screenshots/hero-chinese.png)

## What it is

Paste text and see, side by side, how seven tokenizers cut it into tokens —
colored byte spans, token counts, byte-per-token efficiency, word
fragmentation, and where the tokenizers disagree. The OpenAI tokenizer demo
and the Hugging Face playground each show one tokenizer at a time;
tokenviewer's point is the _comparison_ — and the analysis layer underneath it.

Everything runs in the browser. No text is sent anywhere.

## What you can do with it

- Paste a paragraph and watch GPT-2 spend 3x more tokens on Chinese than
  DeepSeek-V3 does.
- See a Python type annotation tokenized differently by every model family.
- Watch an emoji or a chemical formula get shredded into byte fragments.
- Read off byte-per-token efficiency and common-word fragmentation per
  tokenizer.
- Share a comparison by URL — the input and tokenizer selection are encoded
  in the link.

## Privacy

All tokenization happens in your browser. No text is sent to a server. There
is no analytics, no telemetry, and no third-party script — after first load
the only network requests are same-origin tokenizer data files. A network
trace confirms it; see `docs/AUDIT_V0.md`.

## Supported tokenizers

| Tokenizer   | Family   | Algorithm             | Vocab   | Engine            |
| ----------- | -------- | --------------------- | ------- | ----------------- |
| GPT-2       | OpenAI   | byte-level BPE        | 50,257  | js-tiktoken       |
| cl100k_base | OpenAI   | byte-level BPE        | 100,277 | js-tiktoken       |
| o200k_base  | OpenAI   | byte-level BPE        | 200,019 | js-tiktoken       |
| Llama 3     | Meta     | byte-level BPE        | 128,256 | @lenml/tokenizers |
| DeepSeek-V3 | DeepSeek | byte-level BPE        | 129,280 | @lenml/tokenizers |
| Qwen3       | Alibaba  | byte-level BPE        | 151,669 | @lenml/tokenizers |
| mT5         | Google   | SentencePiece unigram | 250,100 | @lenml/tokenizers |

Every adapter is verified against a canonical reference — Python `tiktoken`
for the OpenAI encodings, the Rust `tokenizers` library for the Hugging Face
tokenizers, on the exact `tokenizer.json` the app ships. See
`tests/tokenizers.test.ts`.

## Reference corpus

A fixed 10-text corpus is run through every tokenizer at build time
(`scripts/precompute_baseline.ts`); the app shows the result table. The five
language samples are the same passage translated, so the numbers compare
like with like. Token counts for that passage:

| Sample        | Fewest tokens | Most tokens | Spread |
| ------------- | ------------: | ----------: | -----: |
| English prose |            61 |          77 |  1.26x |
| Chinese       |            51 |         175 |  3.43x |
| Japanese      |            59 |         158 |  2.68x |
| Arabic        |            70 |         213 |  3.04x |
| Swahili       |            83 |         118 |  1.42x |

Two things stand out. The cost of non-English text depends heavily on the
tokenizer — the same Chinese paragraph is 3.4x more expensive under GPT-2 than
under DeepSeek-V3. And Swahili, though written in the Latin alphabet, still
costs more than English under _every_ tokenizer (83 tokens at best vs 61) —
the gap is training-data coverage, not the writing system. This is the
tokenizer-fairness effect documented by Petrov et al. (2023) and Ahia et al.
(2023); see `docs/RESEARCH_BACKDROP.md`.

## Analysis layer

Four modules, each shown as a collapsible panel:

- **Efficiency** — token count, chars/token, bytes/token, and each
  tokenizer's count relative to the most efficient one for the current input.
- **Word fragmentation** — how often common English words are kept whole
  versus split. Reports `not applicable` (never a misleading 0%) for CJK,
  Arabic, or symbol-heavy input.
- **Cross-tokenizer agreement** — for each position in the input, how many
  tokenizers placed a boundary there; disagreement zones are highlighted.
- **Token-id distribution** — a vocabulary-decile histogram of the token ids
  used, a rough hint at how much the input leans on rare merges.

## Compared to existing tools

|                                           | tokenviewer  | OpenAI tokenizer demo | HF tokenizer playground |
| ----------------------------------------- | ------------ | --------------------- | ----------------------- |
| Side-by-side cross-tokenizer view         | yes          | no                    | no                      |
| Non-OpenAI tokenizers                     | yes (4 of 7) | no                    | yes (one at a time)     |
| Analysis layer                            | 4 modules    | none                  | none                    |
| Precomputed multilingual reference corpus | yes          | no                    | no                      |
| Shareable-URL comparisons                 | yes          | no                    | no                      |
| Client-side / no text sent to a server    | yes          | yes                   | yes                     |

## Develop

```sh
npm install
npm run setup     # downloads tokenizer data + fonts into public/ (required)
npm run dev       # http://localhost:5173
```

`npm run setup` is required before the app will run — `public/tokenizers/` is
not committed (it is ~43 MB of vocabulary files). CI and the deploy workflow
run it automatically.

Other scripts: `npm test`, `npm run check`, `npm run lint`, `npm run build`,
`npm run precompute` (regenerate the reference-corpus results). There is also
an optional headless runtime check, `npm run smoke` — it is not wired into CI
and needs Playwright installed separately (`npm i -D playwright && npx
playwright install chromium`) plus a running `npm run preview`.

## Adding a tokenizer

1. Add an entry to `src/tokenizers/registry.ts` with a frozen short `code`.
2. Add its repo to `scripts/fetch_tokenizers.mjs` (for an HF tokenizer) — the
   `tiktoken` and `hf` engines already cover byte-level BPE and SentencePiece.
3. Run `npm run fetch:tokenizers`, then `npm run precompute`.
4. Add a canonical fixture in `scripts/gen_reference.py` and run it; the test
   suite will assert the adapter matches.

See `CONTRIBUTING.md`.

## Roadmap

- More tokenizers — Gemma, Mistral (tekken), a WordPiece model.
- Mobile: reflow the comparison table to a card list below 600px.
- Batch mode — aggregate statistics over a multi-document paste.
- An embeddable widget for blog posts.
- A `tokenviewer` CLI sharing the same adapters.

## Related work

- **OpenAI tokenizer demo**, **Hugging Face tokenizer playground**,
  **tiktokenizer** (dqbd) — prior interactive tokenizer tools; tokenviewer
  adds the cross-tokenizer comparison and the analysis layer.
- **Andrej Karpathy's "Let's build the GPT Tokenizer"** and **minbpe** — the
  pedagogical companion; tokenviewer is the "here is how the deployed
  tokenizers actually differ" follow-on.
- Companion repos (working names): `nano-pretrain` — train a small model on
  the dataset you just tokenized; `smolbench` — evaluate models on a clean
  benchmark once you have picked a tokenizer; `thinktrace` — inspect how the
  tokenizer shapes a model's reasoning trace.

## Acknowledgements

Built on [js-tiktoken](https://github.com/openai/tiktoken) and
[@lenml/tokenizers](https://github.com/lenML/tokenizers) (a tokenizer-only
fork of [transformers.js](https://github.com/huggingface/transformers.js)).
Tokenizer artifacts are the work of OpenAI, Meta, DeepSeek, Alibaba, and
Google. The framing owes a debt to Karpathy's tokenization lecture.

## Citation

```bibtex
@software{tokenviewer,
  title  = {tokenviewer: interactive cross-tokenizer comparison},
  year   = {2026},
  url    = {https://github.com/example/tokenviewer},
  note   = {Working name}
}
```

## License

MIT — see `LICENSE`.
