import { Tiktoken } from 'js-tiktoken/lite';
import type { TiktokenBPE } from 'js-tiktoken/lite';
import { buildTokens, type Token, type Tokenizer } from './base';
import type { TokenizerSpec } from './registry';

/**
 * The `Tiktoken` instance keeps a `textMap: Map<rank, Uint8Array>` field. It is
 * marked `@internal` in the typings but is a plain runtime property. We read it
 * for exact per-token bytes — the public `decode()` round-trips through a
 * non-fatal TextDecoder and therefore loses the bytes of sub-character tokens
 * (common for CJK under small-vocab encodings, which is exactly what we want to
 * visualize accurately).
 */
interface TiktokenInternal {
  textMap: Map<number, Uint8Array>;
}

/**
 * Build a tokenizer from a js-tiktoken rank table. The ranks are passed in
 * rather than imported so this module stays free of multi-megabyte data and
 * works identically in the browser worker and the Node precompute script.
 */
export function createTiktokenTokenizer(
  spec: TokenizerSpec,
  ranks: TiktokenBPE,
): Tokenizer {
  const enc = new Tiktoken(ranks);
  const textMap = (enc as unknown as TiktokenInternal).textMap;
  const specialCount = Object.keys(ranks.special_tokens ?? {}).length;
  const vocabSize = textMap.size + specialCount;

  return {
    ...spec,
    vocabSize,
    encode(text: string): Token[] {
      // allowedSpecial=[] and disallowedSpecial=[]: any special-token-like
      // substring in the user's text is encoded as ordinary text, never as a
      // real special token, and never throws.
      const ids = enc.encode(text, [], []);
      const raw = ids.map((id) => ({
        id,
        bytes: textMap.get(id) ?? new Uint8Array(),
      }));
      return buildTokens(raw);
    },
  };
}
