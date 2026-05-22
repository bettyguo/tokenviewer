# TOKENIZER_CHOICES

The default tokenizer set, the library that implements each, and client-side
(JS/WASM) availability. Privacy and offline operation require every tokenizer
to run in the browser with no third-party network call (see
ARCHITECTURE_DECISION.md).

## Selection principle

Cover (a) the historically important, (b) the currently dominant, (c)
algorithmic diversity (byte-level BPE vs SentencePiece unigram vs SP-BPE), and
(d) at least one 2024-2026 release. Avoid near-duplicates that tokenize
identically.

## Default set (v1)

| #   | Tokenizer                      | Family / algorithm            | Vocab                           | Library                      | Client-side                     |
| --- | ------------------------------ | ----------------------------- | ------------------------------- | ---------------------------- | ------------------------------- |
| 1   | GPT-2 BPE                      | byte-level BPE                | 50,257                          | `js-tiktoken` (`gpt2` ranks) | yes, ranks bundled              |
| 2   | cl100k_base (GPT-3.5 / GPT-4)  | byte-level BPE                | 100,277                         | `js-tiktoken`                | yes, ranks bundled              |
| 3   | o200k_base (GPT-4o / o-series) | byte-level BPE                | 200,019                         | `js-tiktoken`                | yes, ranks bundled              |
| 4   | Llama-3                        | tiktoken-style byte-level BPE | 128,256                         | `@huggingface/transformers`  | yes, `tokenizer.json`           |
| 5   | DeepSeek-V3                    | byte-level BPE                | 129,280                         | `@huggingface/transformers`  | yes, `tokenizer.json`           |
| 6   | Qwen2.5 / Qwen3                | byte-level BPE                | 151,643 (151,936 incl. special) | `@huggingface/transformers`  | yes, `tokenizer.json`           |
| 7   | mT5 (SentencePiece)            | SP unigram                    | 250,100                         | `@huggingface/transformers`  | yes, converted `tokenizer.json` |

Seven is the v1 floor and is comfortably above the 5-tokenizer launch cutline.

## Optional / stretch (add if budget remains)

| Tokenizer           | Family                  | Library                     | Notes                                           |
| ------------------- | ----------------------- | --------------------------- | ----------------------------------------------- |
| Gemma               | SentencePiece BPE       | `@huggingface/transformers` | 256k vocab; good SP-BPE contrast to mT5 unigram |
| Mistral (v3 tekken) | byte-level BPE (tekken) | `@huggingface/transformers` | tekken is tiktoken-derived; recent              |
| BERT WordPiece      | WordPiece               | `@huggingface/transformers` | historical contrast; `##` continuation marker   |

## Why these and not others

- **GPT-2 / cl100k / o200k:** the reference trio for "tokenizers got better".
  o200k roughly halves CJK token counts vs cl100k; GPT-2 is the worst-case
  baseline. This progression _is_ a gallery exhibit.
- **Llama-3:** the dominant open-weight family; its tokenizer is a
  128k-vocab tiktoken-style BPE, distinct from o200k in merges.
- **DeepSeek-V3:** a strong 2024-2025 release; 128k byte-level BPE; relevant
  to the "2026 tokenizer releases are content" thesis.
- **Qwen3:** large 151k vocab, strong CJK coverage — the multilingual
  counterpoint that often wins the Chinese gallery sample.
- **mT5:** SentencePiece _unigram_, not BPE. Algorithmically different
  (probabilistic, not merge-based), and a 250k multilingual vocab. Including
  it prevents the set from being "BPE only".

## Algorithm diversity check

- Byte-level BPE: GPT-2, cl100k, o200k, Llama-3, DeepSeek, Qwen (6).
- SentencePiece unigram: mT5 (1).
- SentencePiece BPE: Gemma (optional).
- WordPiece: BERT (optional).

The default set is BPE-heavy by design (that is what production LLMs use), but
mT5 ensures at least one non-BPE algorithm is always visible. The UI labels
each row with its algorithm family.

## Correctness verification plan

Each adapter is verified against the canonical Python reference for 2-3 fixed
strings (ASCII, a CJK string, a code snippet). For the OpenAI trio, reference
is `tiktoken` in Python. For HF tokenizers, reference is
`transformers.AutoTokenizer`. Reference outputs are committed as fixtures in
`tests/fixtures/` and asserted in `tests/tokenizers.test.ts`. No tokenizer
ships without this. (Known gotcha: transformers.js has historically mis-handled
some whitespace/newline edge cases for Llama tokenizers — see
huggingface/transformers.js#1019 — so newline handling is an explicit fixture.)

## Sources

- DeepSeek-V3 technical report (arXiv:2412.19437) — 128K BBPE, vocab 129,280.
- Qwen3 model cards on the HF Hub — 151,643 base vocab.
- js-tiktoken README (encodings: gpt2, r50k, p50k, cl100k, o200k).
- huggingface/transformers.js issue #1019 (Llama newline tokenization).
