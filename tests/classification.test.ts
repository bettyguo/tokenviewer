/**
 * Token-kind classification. The rendering pipeline depends on these kinds
 * — partial (sub-character byte fragments), whitespace, special, and text —
 * so they are worth pinning down.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { TokenizerEngine } from '../src/tokenizers/engine';
import { loadAssetsFromFs } from '../scripts/node_assets';

const CODES = ['gpt2', 'cl100k', 'o200k', 'llama3'];
const engine = new TokenizerEngine();

beforeAll(async () => {
  for (const c of CODES) engine.load(c, await loadAssetsFromFs(c));
}, 30_000);

describe('token-kind classification', () => {
  it('marks sub-character byte fragments as `partial`', () => {
    // GPT-2 has no merges for individual Chinese characters, so a single
    // 3-byte CJK character is split across tokens — exactly the "byte
    // fragment" visualisation the app is built to surface.
    const r = engine.run('你好', 'gpt2');
    expect(r.tokens.some((t) => t.kind === 'partial')).toBe(true);
    // o200k has CJK merges, so the same input should NOT need fragments.
    const r2 = engine.run('你好', 'o200k');
    expect(r2.tokens.every((t) => t.kind !== 'partial')).toBe(true);
  });

  it('marks pure-whitespace tokens as `whitespace`', () => {
    const r = engine.run('a\n\n\nb', 'cl100k');
    expect(r.tokens.some((t) => t.kind === 'whitespace')).toBe(true);
  });

  it('classifies pure ASCII as text or whitespace only', () => {
    const r = engine.run('The quick brown fox jumps over the lazy dog.', 'llama3');
    for (const t of r.tokens) {
      expect(['text', 'whitespace']).toContain(t.kind);
    }
  });

  it('partial-token bytes are recoverable as hex', () => {
    const r = engine.run('世界', 'gpt2');
    const partials = r.tokens.filter((t) => t.kind === 'partial');
    expect(partials.length).toBeGreaterThan(0);
    for (const t of partials) {
      // Each partial token has at least one byte and they are real UTF-8
      // fragments (top bit set — continuation/lead bytes).
      expect(t.bytes.length).toBeGreaterThan(0);
      expect(t.bytes.some((b) => b >= 0x80)).toBe(true);
    }
  });
});
