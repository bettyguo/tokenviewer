import { TokenizerLoader } from '@lenml/tokenizers';
import { buildTokens, byteLevelPieceToBytes, type Token, type Tokenizer } from './base';
import type { TokenizerSpec } from './registry';

const utf8 = new TextEncoder();

/** SentencePiece uses U+2581 ("lower one eighth block") in place of a space. */
const SP_SPACE = '▁';

interface LoadedModel {
  vocab: string[];
  convert_tokens_to_ids(tokens: string[]): number[];
}
interface LoadedTokenizer {
  model: LoadedModel;
  tokenize(text: string, opts: { add_special_tokens: boolean }): string[];
}

/**
 * Build a tokenizer from a Hugging Face `tokenizer.json` / `tokenizer_config.json`
 * pair, using `@lenml/tokenizers` (a tokenizer-only fork of transformers.js —
 * no ONNX runtime, so it stays out of the bundle-size budget).
 *
 * Per-token bytes are recovered exactly:
 *  - byte-level BPE (Llama-3, DeepSeek, Qwen): each `tokenize()` piece is a
 *    byte-level-alphabet string; `byteLevelPieceToBytes` inverts it losslessly.
 *  - SentencePiece (mT5): pieces are real Unicode substrings with U+2581 for
 *    space; bytes are the UTF-8 of the piece. SP offsets are over the
 *    tokenizer's normalized text, which is noted in the UI.
 */
export function createHfTokenizer(
  spec: TokenizerSpec,
  tokenizerJSON: unknown,
  tokenizerConfig: unknown,
): Tokenizer {
  const tok = TokenizerLoader.fromPreTrained({
    tokenizerJSON: tokenizerJSON as object,
    tokenizerConfig: tokenizerConfig as object,
  }) as unknown as LoadedTokenizer;

  const isSentencePiece = spec.algorithm.startsWith('SentencePiece');
  const vocabSize = Array.isArray(tok.model.vocab)
    ? tok.model.vocab.length
    : spec.vocabSize;

  return {
    ...spec,
    vocabSize,
    encode(text: string): Token[] {
      const pieces = tok.tokenize(text, { add_special_tokens: false });
      const ids = tok.model.convert_tokens_to_ids(pieces);
      const raw = pieces.map((piece, i) => {
        const id = ids[i] ?? -1;
        if (isSentencePiece) {
          const literal = piece.split(SP_SPACE).join(' ');
          return { id, bytes: utf8.encode(literal), special: piece === '<unk>' };
        }
        const bytes = byteLevelPieceToBytes(piece);
        if (bytes) return { id, bytes };
        // Out-of-alphabet piece: treat it as a literal special token.
        return { id, bytes: utf8.encode(piece), special: true };
      });
      // SentencePiece prepends a dummy "▁" so it always begins with a space.
      // When the input does not start with whitespace, that leading space is
      // not part of the input — drop it so token byte offsets stay aligned
      // with the other tokenizers (otherwise mT5 is shifted by one byte and
      // the agreement analysis misreads it).
      if (
        isSentencePiece &&
        raw.length > 0 &&
        text.length > 0 &&
        !/^\s/u.test(text) &&
        raw[0].bytes.length > 1 &&
        raw[0].bytes[0] === 0x20
      ) {
        raw[0] = { ...raw[0], bytes: raw[0].bytes.slice(1) };
      }
      return buildTokens(raw);
    },
  };
}
