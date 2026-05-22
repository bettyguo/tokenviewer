# PROJECT_THESIS

> Working name: **tokenviewer** (placeholder — see candidates below). Not committed.

## One sentence

An interactive, in-browser visualization of how 6+ popular LLM tokenizers segment
the same text, with a cross-tokenizer efficiency and fragmentation analysis layer.

## Success criteria — pre-flight

### Primary user

An ML engineer or NLP researcher who wants to either (a) understand how a
specific tokenizer behaves on text they care about, or (b) choose between
tokenizers for a project where token cost, context budget, or multilingual
fairness matters. Secondary users: multilingual-NLP researchers checking the
"language tax", and curious practitioners who watched Karpathy's tokenizer
lecture and want a hands-on artifact.

### Primary input

Text pasted into a textarea. Secondary input paths: a file upload (`.txt`,
`.md`, source files), a small set of one-click sample texts, and a curated
gallery of pre-built "interesting" inputs. URL fetch is deferred (CORS-bound,
low value, see UI_DESIGN.md).

### Primary output

A side-by-side, vertically stacked view: one row per enabled tokenizer, each
showing the _same_ input with color-coded token boundaries. Hovering a token
reveals its id, byte content, and index. Below the rows: a comparison table
(total tokens, bytes-per-token, longest/shortest token, word-fragmentation
rate) and four expandable analysis panels (efficiency, fragmentation,
agreement, token-id distribution).

### The wow moment

A curated gallery of comparisons where tokenizers visibly disagree:

- A Chinese paragraph costing ~3-4x more tokens under GPT-2 BPE than o200k.
- Python with type hints, segmented very differently across tokenizer families.
- A LaTeX math expression shredded into single characters by most tokenizers.
- Emoji and combining characters split mid-grapheme.
- A Swahili sentence as a low-resource control.

The gallery doubles as an onboarding flow and a screenshot mine for launch.

## Why this is worth shipping

- The hero artifact is self-evident: one screenshot of a Chinese paragraph
  tokenized five ways carries the whole pitch.
- No incumbent does cross-tokenizer comparison. The OpenAI demo and HF
  playground are single-tokenizer-at-a-time. See PRIOR_ART.md.
- The analysis layer (efficiency / fragmentation / agreement / distribution)
  is what separates this from a Karpathy-tribute toy.
- Re-launch potential: every new tokenizer release is fresh content.

## Execution risk

A thin demo with shallow analysis gets a star spike and dies. The mitigation
is the analysis layer and a real, precomputed multilingual reference corpus
with honest numbers — research-credible, not decorative.

## Working name

`tokenviewer` is a placeholder. Alternatives considered: `tokenscope`,
`tokenlens`, `bpe-explorer`. Decide before any public launch; the name appears
in `package.json`, the README title, and the deploy URL only.

## Non-goals

- Not a tokenizer _training_ tool (minbpe already teaches that; a "watch BPE
  merge" mini-demo is a deferred stretch goal).
- Not a token _cost calculator_ tied to live API prices.
- No accounts, no persistence, no server-side text processing.
