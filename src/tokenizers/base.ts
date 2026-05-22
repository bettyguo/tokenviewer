/**
 * Shared tokenizer types and byte-level helpers.
 *
 * This module is environment-agnostic: it is imported both by the browser
 * worker and by the Node precompute script, so it must not touch `window`,
 * `fetch`, `self`, or the filesystem.
 */

export type TokenKind = 'text' | 'whitespace' | 'partial' | 'special';

/** One token's contribution to the input, in exact bytes. */
export interface Token {
  /** Position of this token in the sequence (0-based). */
  index: number;
  /** Token id in the tokenizer's vocabulary. */
  id: number;
  /** Exact UTF-8 bytes this token contributes to the input. */
  bytes: Uint8Array;
  /** Best-effort decoded text. Contains U+FFFD for `partial` tokens. */
  text: string;
  kind: TokenKind;
  /** Inclusive byte offset of this token within the input's UTF-8 bytes. */
  startByte: number;
  /** Exclusive byte offset. */
  endByte: number;
}

/** Static description of a tokenizer, safe to serialize. */
export interface TokenizerMeta {
  /** URL-safe short code. Frozen — never changes once shipped. */
  code: string;
  /** Display name. */
  name: string;
  /** Originating organisation, e.g. "OpenAI", "Meta". */
  family: string;
  /** Algorithm family, e.g. "byte-level BPE", "SentencePiece unigram". */
  algorithm: string;
  /** Published vocabulary size. */
  vocabSize: number;
  /** Reference URL (model card or spec). */
  reference: string;
  /** Optional caveat shown in the UI. */
  note?: string;
}

/** A loaded, ready-to-use tokenizer. */
export interface Tokenizer extends TokenizerMeta {
  encode(text: string): Token[];
}

/** Result of running one tokenizer over one input. */
export interface TokenizerResult {
  code: string;
  tokens: Token[];
  /** UTF-8 byte length of the input. */
  byteLength: number;
  /** Unicode code-point count of the input. */
  charLength: number;
  /** Vocabulary size of the tokenizer, as observed at load time. */
  vocabSize: number;
  /** Set if the tokenizer failed to load or run. */
  error?: string;
}

const encoder = new TextEncoder();

/** UTF-8 byte length of a string. */
export function byteLength(text: string): number {
  return encoder.encode(text).length;
}

/** Unicode code-point count (not UTF-16 length). */
export function charLength(text: string): number {
  let n = 0;
  for (const _ of text) n++;
  return n;
}

/**
 * GPT-2 byte-level alphabet (used by every HF ByteLevel BPE tokenizer:
 * Llama-3, DeepSeek, Qwen, ...). Maps each of 256 byte values to a printable
 * Unicode code point so byte sequences survive as text through the BPE.
 */
function buildByteLevelMaps(): {
  byteToCp: number[];
  cpToByte: Map<number, number>;
} {
  const bs: number[] = [];
  const add = (lo: number, hi: number) => {
    for (let i = lo; i <= hi; i++) bs.push(i);
  };
  add(0x21, 0x7e); // ! .. ~
  add(0xa1, 0xac); // ¡ .. ¬
  add(0xae, 0xff); // ® .. ÿ
  const cs = bs.slice();
  let n = 0;
  for (let b = 0; b < 256; b++) {
    if (!bs.includes(b)) {
      bs.push(b);
      cs.push(256 + n);
      n++;
    }
  }
  const byteToCp: number[] = new Array(256);
  const cpToByte = new Map<number, number>();
  for (let i = 0; i < bs.length; i++) {
    byteToCp[bs[i]] = cs[i];
    cpToByte.set(cs[i], bs[i]);
  }
  return { byteToCp, cpToByte };
}

const { cpToByte } = buildByteLevelMaps();

/**
 * Convert a byte-level-alphabet piece string (as produced by an HF ByteLevel
 * BPE tokenizer's `tokenize()`) back into its exact raw bytes.
 * Returns `null` if any character is outside the byte-level alphabet, which
 * signals a special/added token that should be handled literally.
 */
export function byteLevelPieceToBytes(piece: string): Uint8Array | null {
  const out: number[] = [];
  for (const ch of piece) {
    const cp = ch.codePointAt(0)!;
    const b = cpToByte.get(cp);
    if (b === undefined) return null;
    out.push(b);
  }
  return Uint8Array.from(out);
}

const strictDecoder = new TextDecoder('utf-8', { fatal: true });
const lossyDecoder = new TextDecoder('utf-8', { fatal: false });

/** Decode bytes as UTF-8, or `null` if they are not a complete valid sequence. */
export function decodeStrict(bytes: Uint8Array): string | null {
  try {
    return strictDecoder.decode(bytes);
  } catch {
    return null;
  }
}

const WHITESPACE_ONLY = /^\s+$/u;

/** Classify a token from its raw bytes and produce its display text. */
export function classifyToken(
  bytes: Uint8Array,
  opts: { special?: boolean; specialText?: string } = {},
): { text: string; kind: TokenKind } {
  if (opts.special) {
    return { text: opts.specialText ?? lossyDecoder.decode(bytes), kind: 'special' };
  }
  const strict = decodeStrict(bytes);
  if (strict === null) {
    // Bytes do not form a complete UTF-8 sequence — a sub-character fragment.
    return { text: lossyDecoder.decode(bytes), kind: 'partial' };
  }
  if (strict.length > 0 && WHITESPACE_ONLY.test(strict)) {
    return { text: strict, kind: 'whitespace' };
  }
  return { text: strict, kind: 'text' };
}

/**
 * Assemble a `Token[]` from raw `{ id, bytes }` pairs, computing byte offsets
 * and classifying each token. `specialIds` optionally marks ids whose bytes
 * should be treated as a literal special-token string.
 */
export function buildTokens(
  raw: ReadonlyArray<{ id: number; bytes: Uint8Array; special?: boolean }>,
): Token[] {
  const tokens: Token[] = [];
  let offset = 0;
  for (let i = 0; i < raw.length; i++) {
    const { id, bytes, special } = raw[i];
    const { text, kind } = classifyToken(bytes, { special });
    tokens.push({
      index: i,
      id,
      bytes,
      text,
      kind,
      startByte: offset,
      endByte: offset + bytes.length,
    });
    offset += bytes.length;
  }
  return tokens;
}

/** Hex representation of bytes, space-separated, for tooltips and fragments. */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0').toUpperCase()).join(
    ' ',
  );
}
