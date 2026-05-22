# ANALYSIS_LAYER

The analysis layer is what separates tokenviewer from a rendering toy. Four
modules, each a pure function `(results: TokenizerResult[]) => Analysis`,
where `TokenizerResult = { id, tokens: Token[], text: string }`.

All four run on the live input. Module 1 (efficiency) additionally has a
_precomputed_ form over the standardized corpus (CORPUS_DESIGN.md).

## Module 1 — Efficiency (`src/analysis/efficiency.ts`)

Per tokenizer, for the current input:

- `tokenCount`
- `charsPerToken` = input code-point count / tokenCount
- `bytesPerToken` = input UTF-8 byte count / tokenCount
- `compressionRatio` = UTF-8 bytes / tokenCount, expressed as "1 token packs
  N bytes on average" — higher is more efficient.
- `vsBaseline` = tokenCount relative to the most efficient tokenizer in the
  set for this input (e.g. "1.000x", "3.7x").

**Precomputed form:** the same metrics over each of the 10 corpus categories,
read from `baseline_corpus_results.json`, shown as the reference table. This
is where a user sees, concretely, "Chinese costs 3.x more tokens under GPT-2
than o200k" — with a real number from a real run.

Why it matters, not sterile: the `vsBaseline` multiplier and the
language-by-language reference table make the fairness gap (RESEARCH_BACKDROP)
a number the user can read off, not a vague claim.

## Module 2 — Word fragmentation (`src/analysis/fragmentation.ts`)

Question: does a tokenizer keep common words whole, or shred them?

- A built-in list of ~600 common English words ships in
  `data/common_words.json`.
- For each word present in the input, count the tokens that the tokenizer
  used to cover that word's span. A word is "whole" if covered by exactly one
  token (a leading-space variant counts as whole — byte-level BPE encodes
  `" word"` as one token, which is the intended whole-word case).
- `fragmentationRate` = fragmented words / common words found.
- Also report the worst offenders: the common words split into the most
  tokens, with their split shown.

**Non-English / code handling — explicit.** The dictionary is English. For
input detected as predominantly non-Latin (CJK, Arabic) or as code, the module
returns `applicable: false` with a reason string ("fragmentation needs a
word list for this script; not measured"), and the UI shows "n/a" rather than
a misleading "0%". Detection: ratio of input code points in Latin script and
presence of common-word matches. This avoids the false-precision trap called
out in the audit checklist.

## Module 3 — Cross-tokenizer agreement (`src/analysis/agreement.ts`)

Question: where do tokenizers disagree about where to cut?

- For each tokenizer, derive its set of token **boundary positions** (byte
  offsets where one token ends and the next begins), excluding the trivial
  start/end.
- For each candidate boundary position that appears in _any_ tokenizer,
  compute the fraction of tokenizers that also place a boundary there ->
  `agreementScore` per position.
- `overallAgreement` = mean agreement across all candidate boundaries.
- The UI renders the input once with each inter-character gap shaded by
  agreement: gaps where all tokenizers cut together are calm; gaps where they
  diverge are flagged as "disagreement zones". A short list names the
  highest-disagreement substrings.

This is the visually striking module: it shows _where_ in a sentence the
tokenizers stop behaving the same. Useful on code and mixed-script input.

## Module 4 — Token-id distribution (`src/analysis/distribution.ts`)

Question: does the tokenizer "know" this content, or is it reaching for rare,
high-id merges?

- For each tokenizer, histogram the token ids used in the input, bucketed by
  vocab decile (id / vocabSize, 10 buckets).
- Report `medianIdPercentile` and the share of tokens in the top-vocab
  buckets. A high share of high-percentile ids suggests the content is
  composed of rarer merges — a soft signal of out-of-distribution or
  low-resource content for that tokenizer.
- Special tokens are excluded and counted separately.

Caveat shown in the UI: id ordering is only a rough proxy for frequency
(tiktoken merge order roughly tracks frequency; SentencePiece id order does
not strongly). The panel states this so the histogram is not over-read. If the
signal proves shallow in the audit, this is the first module droppable per the
cutline — but it is cheap and the caveat keeps it honest.

## Output contract

Each module returns a serializable object so analyses can be snapshot-tested
(`tests/analysis.test.ts`) and, later, embedded. No module mutates `Token[]`.

## Presentation

Each module renders in its own collapsible panel with: a one-line headline
metric in the collapsed state, the detail on expand, and — where a claim could
be over-read — an explicit caveat line. The goal stated in the audit: a reader
of any panel should learn something they did not know about their input.
