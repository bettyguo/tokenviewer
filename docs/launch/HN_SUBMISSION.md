# Hacker News submission

## Title (<= 80 characters)

Primary:

```
Show HN: Tokenviewer – compare LLM tokenizers side by side in your browser
```

(74 characters.)

Alternates if the title needs a different angle:

- `Show HN: See how 7 LLM tokenizers split the same text, side by side` (66)
- `Show HN: A cross-tokenizer comparison tool for LLM tokenization` (62)

## URL

The live GitHub Pages URL (to be filled in once deployed).

## First comment (post immediately after submitting)

> Author here. I kept wanting to answer questions like "how much more does
> this Chinese paragraph cost under GPT-2 than under o200k" or "does Llama 3
> split this identifier the same way DeepSeek does", and the existing tools
> only show one tokenizer at a time. So this renders the same text through
> seven tokenizers at once — GPT-2, cl100k, o200k, Llama 3, DeepSeek-V3,
> Qwen3, and mT5 — with colored byte spans you can hover.
>
> Two things I think are worth a look beyond the side-by-side view:
>
> - A precomputed reference corpus. The same passage translated into five
>   languages is run through every tokenizer at build time. The Chinese
>   version costs 51 tokens with the most efficient tokenizer and 175 with
>   the least — a 3.4x gap on identical content. Swahili, in the Latin
>   alphabet, still costs more than English under every tokenizer; that gap
>   is training-data coverage, not the script.
> - An analysis layer: per-tokenizer efficiency, common-word fragmentation,
>   and a cross-tokenizer "agreement" view that highlights where the
>   tokenizers stop cutting in the same places.
>
> Everything runs client-side. The text never leaves the browser — there is
> no server, no analytics, no third-party script. Each tokenizer adapter is
> verified in the test suite against a canonical reference (Python `tiktoken`
> for the OpenAI encodings, the Rust `tokenizers` library for the Hugging
> Face ones).
>
> The name is a placeholder. Suggestions welcome, along with bug reports —
> tokenizer edge cases especially.

## Notes

- Do not editorialize in the title; HN dislikes hype. "Show HN" + a plain
  description of what it does.
- If asked "why not just use tiktokenizer": tiktokenizer renders one
  tokenizer at a time from a dropdown. The point here is the simultaneous
  comparison and the analysis layer.
- Expect questions about the multilingual numbers — have the
  `docs/RESEARCH_BACKDROP.md` citations (Petrov et al. 2023, Ahia et al. 2023) ready, and be clear the corpus is small (10 texts) and the numbers
  are illustrative of a documented effect, not a benchmark.
