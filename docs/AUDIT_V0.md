# AUDIT_V0

Self-critique of the v0 build, before iterating to v1. Each item: the
weakness, the fix, an effort estimate, and whether it blocks launch.

Strengths first, briefly, so they are not "fixed" away: all 7 tokenizers are
verified against canonical references (Python `tiktoken`; the Rust
`tokenizers` library on the shipped `tokenizer.json`) — 98 passing assertions,
including the whitespace/newline edge case. The privacy property holds: a
network trace shows only same-origin requests. The JS/CSS bundle is ~224 KB.

## Weaknesses

### 1. SentencePiece phantom leading-space byte — MUST-FIX

mT5's tokenizer adds a dummy `▁` prefix. The adapter maps it to a real space
byte, so mT5's token byte total is input + 1. Confirmed: `"hello world"` is
11 input bytes but 12 token bytes for mT5. This shifts every mT5 byte offset
by one, which **misaligns mT5 in the agreement analysis** and skews its
bytes-per-token in the comparison table.
**Fix:** in `hf.ts`, when the input does not begin with whitespace, drop the
leading space from the first SentencePiece token and renumber offsets.
**Cost:** ~20 min. **Priority:** must-fix — it makes one analysis silently wrong.

### 2. First paint blocked on the slowest tokenizer — MUST-FIX

`runTokenize` resolves only after _every_ requested tokenizer has loaded. On a
cold first visit the comparison view shows seven "loading…" placeholders until
mT5's 16 MB file arrives — even though the OpenAI trio is ready in well under
a second.
**Fix:** stream results per tokenizer — the worker should post each result as
its tokenizer becomes ready, not one batch at the end.
**Cost:** ~35 min. **Priority:** must-fix — it is the single worst first-run impression.

### 3. Cold-load payload is large — PARTIAL FIX

All 7 tokenizers are enabled by default, so a first visit fetches ~43 MB of
tokenizer data (~13 MB over HTTP gzip). Lazy per-tokenizer loading already
means a _disabled_ tokenizer costs nothing, and #2 makes the fast ones appear
immediately.
**Fix:** ship #2; additionally cache hard (immutable assets) and document the
cost honestly. A "lite" default set is deferred — the cross-comparison is the
product, so all 7 stay on by default.
**Cost:** covered by #2. **Priority:** must-fix portion = #2; rest deferred.

### 4. Factual error in the "numbers" gallery sample — MUST-FIX

Its blurb claims "cl100k and GPT-2 do not" group digits. cl100k_base's
pre-tokenizer caps digit runs at three (`\p{N}{1,3}`); the claim is wrong.
Violates the no-fabricated-claims rule.
**Fix:** rewrite the blurb to a verifiable statement about digit chunking.
**Cost:** ~10 min. **Priority:** must-fix.

### 5. Token hues are too faint / weakly colorblind-safe — MUST-FIX

The Okabe-Ito palette is designed for full saturation, but token backgrounds
use it at 24% opacity over the canvas. Adjacent hues become hard to separate,
and the colorblind-safety claim does not survive the opacity reduction.
**Fix:** raise the background opacity, strengthen the per-token separator so
boundaries never depend on hue alone, and re-check adjacent-pair distinctness
in a CVD simulator.
**Cost:** ~25 min. **Priority:** must-fix — accessibility is an explicit gate.

### 6. Token tooltip is mouse-only — MUST-FIX (partial)

The rich token tooltip is bound to `mouseenter`/`mouseleave`; touch and
keyboard users cannot inspect a single token. The "token ids" toggle is a
partial alternative (keyboard-reachable, shows ids inline).
**Fix:** open the tooltip on tap as well; make the "token ids" toggle the
documented accessible path for per-token detail. True per-token keyboard
focus (roving tabindex over hundreds of spans) is deferred.
**Cost:** ~20 min. **Priority:** must-fix the tap path; defer roving focus.

### 7. Wide tables only scroll on mobile — DEFER

The comparison and reference tables overflow a phone viewport and scroll
horizontally rather than reflowing to the per-tokenizer card list the design
called for. Confirmed overflow at 390 px. It is usable (scroll works) but not
the intended mobile experience.
**Fix:** card-list layout for `.ct` below 600 px.
**Cost:** ~40 min. **Priority:** defer — horizontal scroll is acceptable for v1.

### 8. Large-input rendering is not virtualized — MUST-FIX (degrade safely)

Each row renders up to 2,400 token spans; seven rows is ~16,800 DOM nodes, and
a very large paste also means a large structured-clone from the worker.
**Fix:** confirm a 50 k-character paste does not hard-freeze; keep the
per-row cap, add a visible "input truncated for rendering" notice and a soft
character cap on the textarea. True virtualization is deferred.
**Cost:** ~25 min. **Priority:** must-fix the graceful-degradation part.

### 9. Tooltip clips at the viewport top — DEFER

The tooltip is positioned above its token with no flip logic; tokens on the
first line push it off-screen.
**Fix:** flip below the token when there is no room above.
**Cost:** ~10 min. **Priority:** defer — cosmetic, cheap, do if time allows.

### 10. Token-id distribution is the shallowest panel — DEFER

It is a vocab-decile histogram with a caveat that id order only loosely tracks
frequency. The brief itself flags it as the droppable module.
**Fix:** keep it with the caveat for v1; revisit whether it earns its place.
**Cost:** 0 (decision). **Priority:** defer.

### 11. Tokenizer coverage — DEFER (stretch)

Seven tokenizers, but only one non-BPE (mT5). No Gemma, no Mistral (tekken),
no WordPiece. Seven meets the launch floor of five.
**Fix:** add Gemma and/or Mistral in Phase 4 if budget remains.
**Cost:** ~20 min each. **Priority:** defer to stretch.

### 12. Narrow automated-test corpus — DEFER

Canonical verification is strong but uses only 6 strings; no emoji/ZWJ case,
and nothing asserts the `partial` / `whitespace` / `special` token-kind
classification.
**Fix:** add an emoji fixture string and a token-kind classification test.
**Cost:** ~20 min. **Priority:** defer — current coverage is adequate for launch.

### 13. `role="button"` on token spans is wrong semantics — MUST-FIX

Token spans carry `role="button"` with `tabindex="-1"` and no key handler —
they are not buttons. Also the spinner and transitions ignore
`prefers-reduced-motion`.
**Fix:** drop the bogus role; extend the reduced-motion query to the spinner
and non-essential transitions.
**Cost:** ~15 min. **Priority:** must-fix — it is a real a11y defect and cheap.

### 14. No Open Graph / Twitter card metadata — MUST-FIX (Phase 5)

A tool whose entire premise is shareable URLs has no `og:`/`twitter:` tags, so
shared links render as a bare URL.
**Fix:** add OG/Twitter meta and a static preview image in Phase 5.
**Cost:** ~20 min. **Priority:** must-fix for launch, scheduled in Phase 5.

### 15. Heat shading ignores the metric toggle — DEFER

The reference-table heat color is always token-count-based even when the table
is showing bytes-per-token.
**Fix:** drive heat from the active metric.
**Cost:** ~10 min. **Priority:** defer — minor visual inconsistency.

### 16. Setup step is a clone-time requirement — DEFER (document)

`public/tokenizers/` is gitignored; a fresh clone is non-functional until
`npm run setup` runs. CI and the deploy workflow handle it, but a contributor
will hit a blank app otherwise.
**Fix:** state it prominently at the top of the README and in CONTRIBUTING.
**Cost:** ~5 min. **Priority:** defer to Phase 5 documentation.

## Phase 4 plan

Must-fix before launch: items 1, 2, 4, 5, 6 (tap), 8 (degrade), 13. Item 14 is
must-fix but scheduled into Phase 5. Everything else is deferred with the
reasons above. Stretch (item 11) only after the must-fix list is clear.
