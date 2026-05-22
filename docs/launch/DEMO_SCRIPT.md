# Demo recording script

A 30–60 second screen recording for the launch (the hero GIF/clip referenced
in the README and the X thread). Record at 1280x800 or larger, dark theme,
mouse movements slow and deliberate. No audio needed; the on-screen text
carries it. Export the first ~5 seconds separately as the looping hero GIF.

## Shot list

**0:00–0:06 — Open cold.**
Load the live URL. The page opens on the preloaded English+Chinese sample;
the seven tokenizer rows fill in (OpenAI ones first, the larger Hugging Face
ones a beat later — this is the streaming load, let it show). Do not narrate;
let the rows populate.

**0:06–0:16 — Type English, then switch to Chinese.**
Select the input, type a short English sentence. Pause one second on the
result — note the token counts across rows are close. Then select all and
paste a Chinese paragraph. Pause. The GPT-2 row is now visibly the densest;
its count jumps well above the others. This contrast is the core of the demo —
hold on it for a full two seconds.

**0:16–0:24 — Hover a token.**
Move to the GPT-2 row and hover one of the orange "byte fragment" tokens in
the Chinese text. The tooltip shows the raw bytes — a single Chinese character
split across tokens. Move to the DeepSeek row and hover the same area: one
clean token. The point lands without words.

**0:24–0:34 — Open a gallery card.**
Scroll to the gallery. Click "Python with type hints". The input swaps; scroll
back up. The comparison table is visible — pan slowly across the token counts
and the bytes-per-token column.

**0:34–0:44 — Expand one analysis panel.**
Click the "Cross-tokenizer agreement" panel. Let the agreement strip render;
the disagreement marks are visible. Brief pause.

**0:44–0:52 — The reference corpus.**
Scroll to the reference-corpus table. Pan across the Chinese column — the heat
shading goes from dark (efficient) to bright (expensive). Pause on it.

**0:52–0:58 — Close.**
Scroll back to the top. Cut.

## The 5-second hero loop

From the 0:06–0:16 segment: the moment the Chinese paragraph is pasted and the
GPT-2 row balloons relative to the others. Trim to a clean ~5s loop, export as
GIF or short MP4. This is the single artifact that carries the launch.

## Capture notes

- Use the dark theme (default).
- Disable the cursor blink in the recording tool if it is distracting.
- Keep the browser chrome minimal — hide bookmarks, use a clean profile.
- If the streaming load looks too slow on a cold cache, do one warm-up load
  first so tokenizer files are cached, then record.
- No captions baked in; the UI text is legible enough. Add captions only in
  the platform's own tooling if needed.
