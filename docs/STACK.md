# STACK

## Framework — Svelte 5

Chosen over Vue 3 and vanilla JS.

- The app is one reactive page: input changes fan out to N tokenizer rows,
  a table, and four analysis panels. Svelte's fine-grained reactivity (runes:
  `$state`, `$derived`, `$effect`) expresses this directly with no virtual-DOM
  overhead.
- Svelte compiles away — the framework runtime is small, which protects the
  <2MB bundle budget. Vue 3 ships a larger runtime; vanilla JS would mean
  hand-rolling reactivity and inviting state bugs in exactly the fan-out the
  app is built around.
- Single-file components keep each piece (`TokenizerRow`, `ComparisonTable`,
  `Gallery`) self-contained.

React + Tailwind was explicitly out of scope per the brief.

## Build — Vite

Standard Svelte + Vite + TypeScript template. `base` is set to the repo path
for GitHub Pages project-site hosting. A web worker is bundled via Vite's
`?worker` import.

## Language — TypeScript, strict

`strict: true`. The tokenizer adapter boundary (`Tokenizer` interface in
`src/tokenizers/base.ts`) is the most important type contract; everything
downstream consumes `Token[]`.

## Styling — custom CSS, not Tailwind

A single design-token CSS file (`src/styles/theme.css`) of CSS custom
properties, plus scoped styles inside each Svelte component. Reasons:

- The token-span rendering needs a precise, hand-tuned categorical color
  system; utility classes add no value there.
- No build-time CSS framework dependency keeps the bundle lean and the
  dependency list honest.
- A custom palette is required to hit the colorblind-safe constraint
  deliberately rather than reaching for framework defaults.

Pick-one rule honored: custom CSS only, no Tailwind anywhere.

## Typography

The `frontend-design` skill discourages generic fonts; the brief suggested
Inter. Resolution:

- **Token rendering + all data: JetBrains Mono**, self-hosted as woff2 under
  `public/fonts/`. This is the font that matters — every token span is set in
  it. Self-hosting keeps the privacy claim intact (no third-party font CDN).
  `scripts/fetch_assets.mjs` downloads it; CSS falls back to `ui-monospace,
"Cascadia Code", Menlo, monospace` if absent, so the build never depends on
  the download succeeding.
- **UI chrome / prose: a system grotesque stack** — `system-ui, "Segoe UI",
Roboto, sans-serif`. Intentional restraint: the instrument aesthetic puts
  the personality in the mono and the color system, not a display face.
- CJK / Arabic inside token spans fall back to the OS font automatically;
  JetBrains Mono covers Latin/code only, which is expected.

## Aesthetic direction — "laboratory instrument"

Dark, near-black canvas. One warm amber accent (instrument-readout amber).
Hairline borders, data-dense panels with disciplined spacing. The token color
palette is the visual centerpiece: an 8-hue categorical, colorblind-safe set
cycled across adjacent tokens. No gradients-on-white, no decorative emoji, no
SaaS-dashboard look. Light theme is offered as a toggle for screenshots and
accessibility; dark is default.

## Testing — Vitest

- `tests/tokenizers.test.ts` — adapters vs committed Python reference
  fixtures.
- `tests/analysis.test.ts` — efficiency / fragmentation / agreement /
  distribution on fixed inputs.
- `tests/encoding.test.ts` — URL encode/decode round-trip, including CJK and
  long inputs.

## Lint / format

`eslint` (typescript-eslint + eslint-plugin-svelte) and `prettier`
(prettier-plugin-svelte). `svelte-check` for type-checking `.svelte` files.

## Dependency budget

Every runtime dependency must justify itself:

| Package                     | Role                            | Justified                        |
| --------------------------- | ------------------------------- | -------------------------------- |
| `svelte`                    | framework, compiles away        | yes                              |
| `js-tiktoken`               | OpenAI encodings, ranks bundled | yes                              |
| `@huggingface/transformers` | HF-format tokenizers            | yes — tokenizer-only import path |
| `lucide-svelte`             | neutral UI icons (no emoji)     | yes — tree-shaken, ~per-icon     |

Dev-only: `vite`, `typescript`, `vitest`, `eslint`, `prettier`,
`svelte-check`, `@sveltejs/vite-plugin-svelte`. No others without a line in
PROGRESS.md explaining why.

## Hosting — GitHub Pages

Static output of `vite build` in `dist/`, published by
`.github/workflows/deploy-pages.yml`. CI (`ci.yml`) runs lint, type-check,
and tests on every push.
