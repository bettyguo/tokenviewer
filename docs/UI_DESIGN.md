# UI_DESIGN

Single page, no routing beyond URL-encoded state. Desktop-first, responsive
down to phone width. Dark default, light toggle.

## Layout (top to bottom)

### 1. Header

- Wordmark `tokenviewer` (placeholder name) + one-line descriptor:
  "compare how LLM tokenizers segment the same text".
- A privacy pill: "runs in your browser — no text leaves this page".
- Theme toggle, GitHub link. No nav, no login.

### 2. Input panel

- A `<textarea>`, auto-growing, monospace, with a subtle line-of-instrument
  feel (hairline border, focus glow in accent amber).
- Toolbar row beneath it:
  - Sample buttons (3-4 quick inline samples).
  - File upload (`.txt`, `.md`, code files; read locally, never uploaded).
  - "Clear".
  - Live counters: characters, UTF-8 bytes, words.
- Debounced 120ms; tokenization dispatched to the worker on settle.

### 3. Tokenizer selector

- One chip per tokenizer, each carrying its keyed accent dot, name, and
  algorithm tag (e.g. "byte-BPE", "SP-unigram"). Click toggles enable.
- "All" / "None" shortcuts. Default: all 7 enabled.
- A loading spinner appears on a chip while its `tokenizer.json` streams in;
  the chip is interactive immediately and resolves when ready.

### 4. Main comparison view — stacked tokenizer rows

One row per enabled tokenizer:

- **Row header:** name, algorithm tag, vocab size, and the live token count
  for the current input. A "fragmentation alert" marker if the tokenizer
  splits an unusually high share of common words.
- **Body:** the input text re-rendered as a sequence of token `<span>`s, each
  with a background from the categorical palette (cycled, adjacent tokens
  always differ). Whitespace tokens get a faint hatch so they are visible.
  Newlines render a visible glyph then wrap.
- **Hover a token:** tooltip with token id, the decoded text, the raw bytes
  as hex, the token index, and the character range.
- **Click the row:** toggles persistent inline token-id labels (small
  superscript ids) on every span — the "show me the numbers" mode.
- Rows are independently collapsible.

Stacking (not columns) is deliberate: it keeps each tokenizer's segmentation
on a full-width line so wrapping behaves identically across rows, and it is
the same layout on desktop and mobile.

### 5. Comparison table

Sortable. One row per enabled tokenizer, columns:

- Tokenizer
- Total tokens
- Characters / token
- UTF-8 bytes / token
- Longest token (value + char length)
- Shortest non-trivial token
- Word-fragmentation rate (English inputs; "n/a" otherwise — see
  ANALYSIS_LAYER.md)

The lowest token count and highest bytes/token are highlighted as "most
efficient for this input".

### 6. Analysis panels (expandable, collapsed by default)

Four panels — Efficiency, Fragmentation, Agreement, Token-id distribution.
Specified in ANALYSIS_LAYER.md. Each is collapsed on load so the page is not
overwhelming; a one-line summary shows in the collapsed header.

### 7. Reference corpus section

Separate, clearly labelled "Reference corpus — precomputed". A table of
bytes-per-token for every tokenizer across the 10 standardized corpus
categories (CORPUS_DESIGN.md), loaded from `data/baseline_corpus_results.json`.
A short prose callout surfaces 2-3 honest findings (e.g. the CJK cost ratio).
This section is static reference, not driven by the user's input.

### 8. Gallery

A grid of cards, each a curated input. Card shows a title, a one-line "why
this is interesting", and the input category. Clicking a card loads the text
into the input, updates the URL, and scrolls to the comparison view. Loaded
from `data/gallery_samples.json`.

### 9. Footer

Library credits with versions, license, link to the docs, companion-repo
links. No tracking, no analytics script — stated explicitly.

## Empty / edge states

- **Empty input:** the comparison view shows a single onboarding hint
  ("paste text, pick a sample, or open the gallery"), not empty rows. On first
  visit with no URL state, a short English+Chinese sample is preloaded so the
  page is never blank.
- **Very long input (>50k chars):** a non-blocking notice that rendering is
  capped; tokenization still runs, span rendering virtualizes or truncates
  with a "showing first N tokens" marker.
- **Tokenizer load failure:** the chip shows an error state with a retry; the
  row renders "unavailable" rather than silently disappearing. No mocked
  output ever substitutes for a real tokenizer.

## Interaction principles

- Everything updates live; no "Run" button.
- The URL always reflects current state (input + enabled tokenizers) so any
  view is shareable. See STATIC_SITE_ROUTING.md.
- Keyboard: textarea is the focus on load; analysis panels are reachable by
  tab; tooltips also open on focus, not hover only.

## Responsive behavior

- **>= 900px:** full layout as above.
- **600-900px:** selector chips wrap; comparison table keeps all columns with
  horizontal scroll inside its own container.
- **< 600px:** rows stay full-width and stacked (the layout already suits
  this); the comparison table switches to a per-tokenizer card list so no
  data is lost; analysis panels stay collapsible. Tooltips become tap-to-open.

## Accessibility

- Token colors are a colorblind-safe categorical set; color is never the only
  signal — token boundaries also have a 1px separator and hover/focus outline.
- Contrast: token text meets WCAG AA against every palette background (the
  palette is tuned for this, verified in Phase 3).
- All controls are real buttons/inputs with labels; tooltips are
  focus-accessible; theme toggle persists in `localStorage`.

## Explicitly out of scope for v1

- URL fetch of remote text (CORS-bound, low value) — deferred.
- Multi-turn chat-message composer (tiktokenizer has it; not our angle).
- Editing tokenizer parameters.
