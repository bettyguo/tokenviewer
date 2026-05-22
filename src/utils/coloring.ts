/**
 * Token and tokenizer color assignment.
 *
 * The token-span palette is the Okabe-Ito qualitative palette, designed to be
 * distinguishable under the common forms of color vision deficiency. Spans use
 * the hue as a translucent background over the theme canvas, so the theme
 * foreground text keeps full contrast regardless of which hue a token gets;
 * color is therefore never the only boundary signal (a separator and the
 * hover/focus outline carry it too).
 */

/** Okabe-Ito qualitative palette (colorblind-safe), seven hues. */
export const TOKEN_PALETTE: readonly string[] = [
  '#e69f00', // orange
  '#56b4e9', // sky blue
  '#009e73', // bluish green
  '#d6c200', // yellow (darkened from #f0e442 for AA contrast on light theme)
  '#0072b2', // blue
  '#d55e00', // vermillion
  '#cc79a7', // reddish purple
];

/** Hue for the token at sequence position `index`. Adjacent tokens differ. */
export function tokenColor(index: number): string {
  return TOKEN_PALETTE[index % TOKEN_PALETTE.length];
}

/**
 * A stable accent hue per tokenizer code, used for selector chips and row
 * keying. Order matches docs/TOKENIZER_CHOICES.md.
 */
export const TOKENIZER_HUES: Readonly<Record<string, string>> = {
  gpt2: '#56b4e9',
  cl100k: '#009e73',
  o200k: '#e69f00',
  llama3: '#cc79a7',
  deepseek: '#d55e00',
  qwen3: '#0072b2',
  mt5: '#a78bda',
};

export function tokenizerHue(code: string): string {
  return TOKENIZER_HUES[code] ?? '#8a8f98';
}
