# STATIC_SITE_ROUTING

The app is a single static page. The only "routing" is URL-encoded state so
any comparison is shareable by link.

## What is encoded

1. **Input text** — arbitrary Unicode, possibly long.
2. **Enabled tokenizers** — a subset of the known short codes.
3. (Optional) **theme** — only if the user overrode the default.

## Where it lives — the hash, not the query

State is stored in the URL **hash fragment** (`#...`), not the query string:

- GitHub Pages serves a static `index.html`; a hash needs no SPA-fallback
  server config and never triggers a server request — the hash is never sent
  to the server, which also keeps the input text strictly client-side
  (privacy).
- Changing the hash does not reload the page.

Format: `#i=<encoded-input>&t=<codes>&th=<theme>`

## Tokenizer codes

Short, stable codes (not display names): `gpt2`, `cl100k`, `o200k`, `llama3`,
`deepseek`, `qwen3`, `mt5`, plus `gemma`, `mistral`, `bert` if added. `t` is a
comma-separated list. Absent `t` = default set. Codes are frozen; renaming a
tokenizer does not change its code, so old links keep working.

## Input encoding — gzip + base64url

`i` is produced by:

1. UTF-8 encode the text (`TextEncoder`).
2. gzip via the native `CompressionStream("gzip")` — available in all current
   evergreen browsers; a small pure-JS fallback (`fflate`-style deflate) is
   used if absent. (Decision: try native first; if `CompressionStream` is
   undefined, fall back. This avoids a hard dependency.)
3. base64url encode the gzip bytes (`+/=` -> `-_` and stripped) so the string
   is URL-safe with no escaping.

Decode reverses this on page load. Round-trip is covered by
`tests/encoding.test.ts` including CJK, emoji, and a 5kB input.

## Length budget

- gzip handles repetitive and prose text well; a typical 200-400 char sample
  compresses before base64. base64 then adds ~33%.
- Worst case among the gallery samples is measured in Phase 2 and recorded in
  PROGRESS.md. Target: gallery-sample URLs stay well under 2,000 characters
  (the practical browser URL limit and comfortably shareable).
- **Twitter/X:** every link counts as 23 characters via `t.co` regardless of
  real length, so URL length is a non-issue there. **Hacker News** and
  **Reddit** accept long URLs in comments. The only real ceiling is the
  ~2,000-char browser limit and copy-paste ergonomics.
- For inputs too large to encode comfortably (> ~8kB), the share action does
  not put the text in the URL; it copies a link with tokenizer selection only
  and shows a notice ("input too large to embed in a link — share the text
  separately"). No silent truncation.

## Update behavior

- The URL is rewritten with `history.replaceState` (not `pushState`) on a
  debounced input change, so typing does not flood browser history.
- A "Copy share link" button performs the encode on demand and writes the URL
  to the clipboard; this is the explicit share path.
- Loading a gallery sample uses `pushState` so Back returns to the previous
  sample.

## Decode safety

On load, malformed or oversized `i` values fail closed: the input is left
empty and a dismissable notice explains the link could not be read. Decoding
never throws into the UI and never executes any decoded content as code — it
is only ever placed as the textarea's text value.
