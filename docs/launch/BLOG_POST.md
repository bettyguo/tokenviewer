# Nine tokenizers, one paragraph: building a cross-tokenizer viewer

_~1,500 words. Audience: ML engineers and multilingual NLP researchers._

Tokenization is the part of the LLM pipeline that is easiest to forget about
and surprisingly expensive to get wrong. It runs before the model sees
anything, it has its own training data and its own algorithm, and once a model
ships, its tokenizer is frozen. Yet most of us interact with it through a
single number — a token count in an API dashboard — and never look at the
segmentation itself.

This post is about a small tool for looking at it: an in-browser viewer that
renders the same text through nine tokenizers at once, with an analysis layer
underneath. The tool is `tokenviewer`. But the tool is the easy part;
the interesting part is what becomes visible once you can compare.

## Why tokenizer choice is not a rounding error

Three reasons it matters in 2026.

**Cost and context.** The token count is the billing unit and the context
unit. A tokenizer that needs 30% more tokens for your domain raises your cost
by 30% and shrinks your usable context window by the same fraction. As context
windows grew, this stopped being noise.

**Model behavior.** A long line of observations — Karpathy's tokenization
lecture collects many of them — ties model failures to tokenization. Why
arithmetic is hard, why models miscount letters, why some structured formats
work better than others: a lot of it is downstream of how digits, whitespace,
and rare strings get segmented.

**Fairness.** This is the one that does not show up in an API dashboard. The
cost of conveying the same information varies enormously by language, and the
variation tracks how well-represented the language was in the tokenizer's
training data. Petrov et al. (NeurIPS 2023) measured tokenized-length
differences of up to 15x across languages; Ahia et al. (EMNLP 2023) showed
that speakers of many languages are billed more and served worse by commercial
APIs. Tokenization is where that inequality originates.

All three are hard to feel from a number. They are easy to feel from a
picture.

## What already existed, and what it did not do

There are good interactive tokenizer tools. OpenAI's tokenizer demo shows
colored token spans for the GPT family. The Hugging Face tokenizer playground
loads an arbitrary tokenizer from the Hub. tiktokenizer (by dqbd) is a polished
playground for the OpenAI encodings with a model dropdown.

What none of them do is show several tokenizers _at the same time_. Every one
is single-tokenizer: you pick one, you see one. If you want to know how a
paragraph compares across GPT-2, Llama 3, and DeepSeek, you switch back and
forth and hold the difference in your head. And none of them has an analysis
layer — there is no notion of "how often does this tokenizer split a common
word" or "where do these two tokenizers disagree".

So the design brief was narrow: render one input through a curated set of
tokenizers, stacked, simultaneously; and add the analysis that the
single-tokenizer tools have no reason to have.

## The design

Nine tokenizers, chosen for coverage rather than completeness: GPT-2,
cl100k_base, and o200k_base (the OpenAI progression); Llama 3, DeepSeek-V3,
Qwen3, and Mistral's tekken (dominant open-weight families, all byte-level
BPE with different merges); and mT5 plus Gemma 2 (two SentencePiece variants,
unigram and BPE, deliberately included so the set is not algorithmically
monotone).

Everything runs client-side. This is a deliberate constraint, not a
convenience. The OpenAI encodings run through `js-tiktoken`; the Hugging Face
tokenizers run through `@lenml/tokenizers`, a tokenizer-only fork of
transformers.js with no ONNX runtime. Both execute in a Web Worker. The text
you paste never leaves the browser — there is no server to send it to, no
analytics, and no third-party script. A privacy claim is only worth making if
it is structurally true, so the architecture makes it structurally true.

Correctness was the part most worth being strict about. It is easy to ship a
tokenizer viewer that produces a _plausible_ segmentation that is subtly wrong.
Each adapter is verified in the test suite against a canonical reference:
Python's `tiktoken` for the OpenAI encodings, and the Rust `tokenizers` library
for the Hugging Face tokenizers — run on the exact `tokenizer.json` the app
ships. The JS adapter has to reproduce the reference token ids exactly, on
every test string, including a whitespace-and-newline case. A tokenizer that
cannot be verified does not get added.

## What the reference corpus shows

The viewer includes a precomputed reference corpus: ten short texts run through
every tokenizer at build time. Five of them are the same passage translated
into English, Chinese, Japanese, Arabic, and Swahili — so the comparison is
genuinely like-for-like, the same information in each language.

The token counts for that passage:

| Language | Fewest tokens | Most tokens | Spread |
| -------- | ------------: | ----------: | -----: |
| English  |            60 |          77 |  1.28x |
| Chinese  |            51 |         175 |  3.43x |
| Japanese |            59 |         158 |  2.68x |
| Arabic   |            65 |         213 |  3.28x |
| Swahili  |            83 |         118 |  1.42x |

Two things are worth dwelling on.

First, the spread _within_ a language. The English passage costs essentially
the same — 60 to 62 tokens — under every byte-level BPE tokenizer; the writing
system is well covered and the tokenizers have converged. The Chinese passage
ranges from 51 to 175. The variance is not in the language; it is in the
tokenizer. If you are building on Chinese text, the tokenizer is a 3x cost
lever, and most teams never look at it.

Second, Swahili. It is written in the Latin alphabet, so it is not penalised
for its script the way Chinese or Arabic might be. And yet the _best_ tokenizer
spends 83 tokens on the Swahili passage versus 60 on the English one — 38%
more — and every tokenizer in the set shows the same gap. Same alphabet, same
information, more tokens. The only remaining explanation is training-data
coverage: the tokenizer simply learned fewer useful merges for Swahili. This is
the fairness effect, isolated. It is not a script-rendering artifact; it is a
representation gap, and it is measurable in a tool that fits in a browser tab.

Code shows a smaller but real version of the same thing. A Python function with
type annotations ranges from 77 to 121 tokens across the set — a 1.5x spread,
driven mostly by how each tokenizer handles indentation and digit grouping.

None of these numbers are hand-entered. They are produced by a precompute
script and regenerated whenever a tokenizer is added or upgraded. If the
viewer ever shows a figure, that figure came from a real run.

## The analysis layer

Four modules turn the raw segmentation into something you can read.

**Efficiency** is the obvious one: token count, characters and bytes per
token, and each tokenizer's count relative to the most efficient one for the
current input.

**Word fragmentation** asks how often a tokenizer keeps a common English word
whole versus splitting it. The interesting design decision here was what to do
when it does not apply. For Chinese, Arabic, or symbol-heavy input there are no
common English words to measure, and a tool that reported "0% fragmentation"
there would be quietly lying. So the module reports `not applicable`, with a
reason, instead of a misleading zero.

**Cross-tokenizer agreement** is the one that surprised me most in use. For
every position in the input where _any_ tokenizer placed a boundary, it
computes how many of the others placed one there too, and shades the
disagreement. On plain prose the tokenizers mostly agree. On mixed-script text
— code with CJK comments, say — the view lights up exactly at the script
boundaries. You can see where the tokenizers stop behaving like each other.

**Token-id distribution** is the most speculative: a histogram of token ids by
vocabulary decile, as a rough hint at whether the input leans on rare merges.
It ships with a caveat in the UI, because id order only loosely tracks
frequency. An honest weak signal labelled as one is better than a strong-looking
signal that is not real.

## What is next

The roadmap is short and concrete. More tokenizers — a WordPiece model
(BERT-family), Phi, and whichever 2026 releases turn out to be worth looking
at — since each new release is a reason to look again. A batch mode for
aggregate statistics over a whole document. An embeddable widget, so a
comparison can live inside a blog post rather than behind a link. A
"watch BPE merge" mini-demo in the spirit of Karpathy's tokenization lecture.

But the core is done, and the core is the point: tokenization is worth looking
at directly, and looking at it directly is now a paste away.

The tool is open source, MIT licensed, and runs entirely in your browser. Try
it with your own text — multilingual content and source files are where it
earns its keep.

---

_References: A. Petrov et al., "Language Model Tokenizers Introduce Unfairness
Between Languages", NeurIPS 2023. O. Ahia et al., "Do All Languages Cost the
Same? Tokenization in the Era of Commercial Language Models", EMNLP 2023._
