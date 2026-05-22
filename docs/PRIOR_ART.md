# PRIOR_ART

Survey of comparable tools and content. Goal: confirm the cross-tokenizer
comparison lane is open and identify what to borrow / avoid.

## OpenAI tokenizer demo — platform.openai.com/tokenizer

- Pastes text, shows token count, character count, and color-coded token
  spans. Toggle between "GPT-4o & GPT-4o mini" (o200k) and "GPT-3.5 & GPT-4"
  (cl100k); older page also exposed GPT-2/p50k.
- Runs client-side.
- **Does not do:** cross-tokenizer comparison, any non-OpenAI tokenizer, any
  analysis beyond a raw count, sharing, or a gallery.
- **Borrow:** the color-coded span rendering and the "token ids" toggle.
- **Avoid:** single-tokenizer-at-a-time framing; no analytical depth.

## Hugging Face — "The Tokenizer Playground" space (Xenova)

- A Gradio/Static space that loads an arbitrary HF tokenizer via
  transformers.js and shows token spans for one model at a time. There is a
  separate community comparison space, but it is hard to find and not
  promoted.
- **Does not do:** a curated, opinionated default set; side-by-side rows; an
  analysis layer; a reference corpus.
- **Borrow:** transformers.js is the right client-side engine for HF-format
  tokenizers — proven here. (See ARCHITECTURE_DECISION.md.)
- **Avoid:** UI friction (model id entry, load step). Our default set should
  be one click away.

## tiktokenizer.vercel.app (dqbd)

- The closest existing tool. Online playground for OpenAI tokenizers, built on
  `@dqbd/tiktoken`. Color-coded spans, token count, multi-turn chat-message
  composer with System/User/Assistant roles, cost estimate. Runs entirely in
  the browser, zero backend calls. Some non-OpenAI models were added over time
  via a model dropdown.
- **Does not do:** true _side-by-side_ comparison — it is a dropdown, one
  tokenizer rendered at a time. No efficiency/fragmentation/agreement
  analysis, no reference corpus, no curated multilingual gallery.
- **Borrow:** the zero-backend stance; the clean span rendering; the model
  dropdown breadth.
- **Differentiate:** stacked simultaneous rows + the analysis layer + the
  precomputed multilingual reference corpus. This is the gap.

## Karpathy — "Let's build the GPT Tokenizer" + minbpe

- 2h13m lecture (Feb 2024, youtube.com/watch?v=zduSFxRajkE) and the `minbpe`
  repo: minimal clean BPE training/encoding code. Includes a segment on "the
  quirks of LLM tokenization" (string reversal, arithmetic, JSON vs YAML).
- This is _pedagogical_ and _training_-focused; it does not provide an
  interactive cross-tokenizer comparison.
- **Relationship:** tokenviewer is the interactive companion to that lecture —
  "you understand BPE now; here is how the deployed tokenizers actually
  differ." Acknowledge in README; do not duplicate.

## Other community demos

- `gpt-tokenizer` (npm) playground, `coder/ai-tokenizer` — token-counting
  libraries with thin demo pages, OpenAI-encoding focused.
- Various blog posts comparing tokenizers across languages — all use _static_
  images. None are interactive or cross-comparing. This is the content gap
  tokenviewer fills.

## Conclusion

No tool offers: (1) simultaneous side-by-side rows across a curated set of
6-10 modern tokenizers, (2) a cross-tokenizer analysis layer, (3) a
precomputed multilingual reference corpus, (4) shareable-URL comparisons. That
combination is the product. Single-tokenizer rendering and zero-backend
operation are solved; copy those and move on.

## Sources

- https://platform.openai.com/tokenizer
- https://huggingface.co/spaces/Xenova/the-tokenizer-playground
- https://tiktokenizer.vercel.app/ — https://github.com/dqbd/tiktokenizer
- https://www.youtube.com/watch?v=zduSFxRajkE — https://github.com/karpathy/minbpe
