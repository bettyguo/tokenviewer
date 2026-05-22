# CORPUS_DESIGN

The standardized comparison corpus behind the reference table. Ten short
texts, one per input category, each run through every tokenizer at build time.
Results are committed to `data/baseline_corpus_results.json` and shown in the
"Reference corpus" section.

## Constraints

- 10 categories, one text each, 200-400 characters.
- Texts are **original or public-domain / freely licensed** — no copyrighted
  prose. English texts are written for this project; non-English texts are
  short original sentences or freely available material, kept simple and
  factual to avoid translation-quality artifacts skewing counts.
- Each text is non-trivial enough that token counts are meaningful, short
  enough to render fast.
- Stored in `data/baseline_corpus.json` as
  `[{ id, category, language, text, note }]`.

## The 10 categories

| id             | category                   | language / kind             | what it probes                                           |
| -------------- | -------------------------- | --------------------------- | -------------------------------------------------------- |
| `en-prose`     | English prose              | English (literary register) | the best-case baseline; most tokenizers near-optimal     |
| `en-technical` | English technical          | English (programming docs)  | identifiers, acronyms, mixed case                        |
| `zh`           | Chinese                    | Mandarin (Simplified)       | CJK; the headline fairness exhibit                       |
| `ja`           | Japanese                   | Japanese (kana + kanji)     | mixed scripts in one language                            |
| `ar`           | Arabic                     | Modern Standard Arabic      | RTL script, rich morphology                              |
| `sw`           | Swahili                    | Swahili                     | low-resource control; Latin script but under-represented |
| `code-python`  | Python with type hints     | source code                 | indentation, `:`, `->`, `[]`, snake_case                 |
| `code-sql`     | SQL                        | source code                 | uppercase keywords, punctuation density                  |
| `math-latex`   | LaTeX math                 | markup                      | backslash commands, braces, sub/superscripts             |
| `chem`         | Chemical formulas / SMILES | notation                    | digits, brackets, element symbols — shredded by most     |

## Why these categories

- `en-prose` vs `zh`/`ja`/`ar`/`sw` is the fairness axis: same _amount_ of
  information, very different token cost.
- `sw` is the low-resource control — Latin script (so not penalised for the
  script itself) but under-represented in training data, isolating the
  data-coverage effect from the script effect.
- `code-python` / `code-sql` / `math-latex` / `chem` are the
  structure-and-symbols axis: whitespace, digit grouping, and punctuation
  handling differ sharply across tokenizer families and are independently
  interesting from the language axis.

## Precompute

`scripts/precompute_baseline.ts` (run via `npm run precompute`):

1. Loads `data/baseline_corpus.json`.
2. Instantiates every tokenizer (same adapters as the app).
3. For each (tokenizer, text): records `tokenCount`, `byteCount`,
   `charCount`, `bytesPerToken`, `charsPerToken`.
4. Writes `data/baseline_corpus_results.json` with the matrix plus a
   `generatedAt` timestamp and the tokenizer library versions used.

The script is the _only_ source of numbers in the reference table. No figure
in the README or UI is hand-entered. If a tokenizer is added or upgraded, the
script is re-run and the JSON regenerated — this is a documented release step.

## Honesty rules

- If a precompute run cannot complete for a tokenizer (asset unavailable in
  the build environment), that cell is written as `null` and the UI renders
  "—", never an estimate.
- The reference-section prose callout quotes only ratios that are actually
  present in the committed JSON, and recomputes them from it at render time so
  they cannot drift.

## Reference-table presentation

Rows = tokenizers, columns = the 10 categories, cells = bytes-per-token (a
higher number means the tokenizer packs more text per token = more efficient).
A second toggle shows raw token counts. The CJK columns are where the spread
is widest; the table sorts to make that legible. The derived
"best/worst ratio" per category is shown as a final column — this is the
fairness gap as a single number.
