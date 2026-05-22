/**
 * Verifies every JS tokenizer adapter against canonical references:
 *  - OpenAI encodings vs `tiktoken` (OpenAI's own library)
 *  - HF tokenizers vs the `tokenizers` Rust fast-tokenizer on the same
 *    `tokenizer.json` the app ships
 * References are committed in tests/fixtures/reference.json and regenerated
 * by scripts/gen_reference.py.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { TokenizerEngine } from '../src/tokenizers/engine';
import { TOKENIZERS } from '../src/tokenizers/registry';
import { loadAssetsFromFs, ROOT } from '../scripts/node_assets';

interface Reference {
  texts: Record<string, string>;
  ids: Record<string, Record<string, number[]>>;
}

const reference = JSON.parse(
  readFileSync(join(ROOT, 'tests', 'fixtures', 'reference.json'), 'utf8'),
) as Reference;

const engine = new TokenizerEngine();

beforeAll(async () => {
  for (const spec of TOKENIZERS) {
    engine.load(spec.code, await loadAssetsFromFs(spec.code));
  }
}, 60_000);

describe('tokenizer adapters', () => {
  for (const spec of TOKENIZERS) {
    describe(spec.code, () => {
      for (const [key, text] of Object.entries(reference.texts)) {
        it(`matches the canonical reference for "${key}"`, () => {
          const result = engine.run(text, spec.code);
          expect(result.error).toBeUndefined();
          const ids = result.tokens.map((t) => t.id);
          expect(ids).toEqual(reference.ids[spec.code][key]);
        });

        it(`reconstructs the input bytes for "${key}"`, () => {
          const result = engine.run(text, spec.code);
          if (spec.algorithm === 'byte-level BPE') {
            // Byte-level BPE is lossless: token bytes must reassemble the input.
            const total = result.tokens.reduce((n, t) => n + t.bytes.length, 0);
            expect(total).toBe(result.byteLength);
            let offset = 0;
            for (const t of result.tokens) {
              expect(t.startByte).toBe(offset);
              offset += t.bytes.length;
            }
          }
          // Token indices are always contiguous from zero.
          result.tokens.forEach((t, i) => expect(t.index).toBe(i));
        });
      }

      it('produces no tokens for empty input', () => {
        expect(engine.run('', spec.code).tokens).toHaveLength(0);
      });

      it('reports a plausible vocabulary size', () => {
        const result = engine.run('hello', spec.code);
        expect(result.vocabSize).toBeGreaterThan(40_000);
        for (const t of result.tokens) {
          expect(t.id).toBeGreaterThanOrEqual(0);
          expect(t.id).toBeLessThan(result.vocabSize);
        }
      });
    });
  }

  // Regression guard: SentencePiece prepends a dummy "▁"; the adapter must
  // strip the resulting phantom leading space so mT5 byte offsets stay
  // aligned with the other tokenizers. "hello world" is single-space ASCII,
  // which SentencePiece preserves exactly, so any drift is the phantom space.
  it('mT5 strips the SentencePiece dummy-prefix space', () => {
    const result = engine.run('hello world', 'mt5');
    expect(result.tokens[0].startByte).toBe(0);
    expect(result.tokens[0].text.startsWith(' ')).toBe(false);
    const total = result.tokens.reduce((n, t) => n + t.bytes.length, 0);
    expect(total).toBe(result.byteLength);
  });
});
