import type { TiktokenBPE } from 'js-tiktoken/lite';
import { byteLength, charLength, type Tokenizer, type TokenizerResult } from './base';
import { createTiktokenTokenizer } from './tiktoken';
import { createHfTokenizer } from './hf';
import { TOKENIZER_BY_CODE } from './registry';

/** Raw data needed to instantiate one tokenizer, engine-tagged. */
export type TokenizerAssets =
  | { engine: 'tiktoken'; ranks: TiktokenBPE }
  | { engine: 'hf'; tokenizerJSON: unknown; tokenizerConfig: unknown };

/**
 * Holds loaded tokenizers and runs them. Environment-agnostic: assets are
 * handed in already-parsed, so the same engine drives the browser worker and
 * the Node precompute script.
 */
export class TokenizerEngine {
  private readonly loaded = new Map<string, Tokenizer>();

  isLoaded(code: string): boolean {
    return this.loaded.has(code);
  }

  get(code: string): Tokenizer | undefined {
    return this.loaded.get(code);
  }

  /** Instantiate and register a tokenizer from its assets. */
  load(code: string, assets: TokenizerAssets): Tokenizer {
    const spec = TOKENIZER_BY_CODE.get(code);
    if (!spec) throw new Error(`Unknown tokenizer code: ${code}`);
    if (spec.engine !== assets.engine) {
      throw new Error(
        `Asset engine "${assets.engine}" does not match spec engine "${spec.engine}" for ${code}`,
      );
    }
    const tok =
      assets.engine === 'tiktoken'
        ? createTiktokenTokenizer(spec, assets.ranks)
        : createHfTokenizer(spec, assets.tokenizerJSON, assets.tokenizerConfig);
    this.loaded.set(code, tok);
    return tok;
  }

  /** Tokenize one input with one already-loaded tokenizer. */
  run(text: string, code: string): TokenizerResult {
    const bytes = byteLength(text);
    const chars = charLength(text);
    const tok = this.loaded.get(code);
    if (!tok) {
      return {
        code,
        tokens: [],
        byteLength: bytes,
        charLength: chars,
        vocabSize: 0,
        error: 'not loaded',
      };
    }
    try {
      return {
        code,
        tokens: tok.encode(text),
        byteLength: bytes,
        charLength: chars,
        vocabSize: tok.vocabSize,
      };
    } catch (err) {
      return {
        code,
        tokens: [],
        byteLength: bytes,
        charLength: chars,
        vocabSize: tok.vocabSize,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
