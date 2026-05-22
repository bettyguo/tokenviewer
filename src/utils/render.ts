/** Splits a token into display segments so whitespace is always visible. */
import { bytesToHex, type Token } from '../tokenizers/base';

export type SegmentType =
  | 'text'
  | 'space'
  | 'newline'
  | 'tab'
  | 'cr'
  | 'hex'
  | 'special';

export interface Segment {
  type: SegmentType;
  value: string;
}

const RUN_RE = / +|\t+|\r+|\n|[^ \t\r\n]+/g;

/**
 * Break a token into renderable segments. `partial` tokens (sub-character
 * byte fragments) render as hex; `special` tokens render as a labelled chip;
 * everything else is split so runs of spaces, tabs, and newlines can be shown
 * with explicit glyphs.
 */
export function tokenSegments(token: Token): Segment[] {
  if (token.kind === 'partial') {
    return [{ type: 'hex', value: bytesToHex(token.bytes) }];
  }
  if (token.kind === 'special') {
    return [{ type: 'special', value: token.text }];
  }
  const segments: Segment[] = [];
  const runs = token.text.match(RUN_RE);
  if (!runs) return segments;
  for (const run of runs) {
    const head = run[0];
    if (head === ' ') segments.push({ type: 'space', value: run });
    else if (head === '\t') segments.push({ type: 'tab', value: run });
    else if (head === '\r') segments.push({ type: 'cr', value: run });
    else if (head === '\n') segments.push({ type: 'newline', value: run });
    else segments.push({ type: 'text', value: run });
  }
  return segments;
}

/** A compact, human-readable label for a token's content (used in tooltips). */
export function tokenLabel(token: Token): string {
  if (token.kind === 'partial') return `bytes ${bytesToHex(token.bytes)}`;
  if (token.kind === 'special') return token.text;
  return JSON.stringify(token.text);
}
