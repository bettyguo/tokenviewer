/** Round-trip tests for URL state encoding. */
import { describe, expect, it } from 'vitest';
import {
  decodeInput,
  decodeStateFromHash,
  encodeInput,
  encodeStateToHash,
  MAX_EMBED_BYTES,
} from '../src/utils/encoding';

const CASES: Record<string, string> = {
  ascii: 'The quick brown fox jumps over the lazy dog.',
  cjk: '分词器决定了模型如何看待文本,中文与英文差别很大。',
  emoji: 'family 👨‍👩‍👧‍👦 flag 🇯🇵 thumb 👍🏽',
  multiline: 'line one\n\tindented\nline three\r\nwindows',
  symbols: '\\frac{a}{b} === <|special|> %^&* "quotes"',
  empty: '',
  large: 'lorem ipsum dolor sit amet '.repeat(220),
};

describe('input encoding', () => {
  for (const [name, text] of Object.entries(CASES)) {
    it(`round-trips ${name}`, async () => {
      const encoded = await encodeInput(text);
      expect(/^[A-Za-z0-9_-]*$/.test(encoded.slice(1))).toBe(true); // URL-safe
      expect(await decodeInput(encoded)).toBe(text);
    });
  }

  it('rejects malformed encoded input', async () => {
    await expect(decodeInput('x!!!notvalid')).rejects.toThrow();
  });
});

describe('hash state', () => {
  it('round-trips text, codes, and theme', async () => {
    const state = {
      text: '你好,world',
      codes: ['gpt2', 'o200k'],
      theme: 'light' as const,
    };
    const { hash, inputEmbedded } = await encodeStateToHash(state);
    expect(inputEmbedded).toBe(true);
    const decoded = await decodeStateFromHash(hash);
    expect(decoded.text).toBe(state.text);
    expect(decoded.codes).toEqual(state.codes);
    expect(decoded.theme).toBe('light');
  });

  it('does not embed input larger than the limit', async () => {
    const big = 'x'.repeat(MAX_EMBED_BYTES + 1);
    const { hash, inputEmbedded } = await encodeStateToHash({
      text: big,
      codes: ['gpt2'],
    });
    expect(inputEmbedded).toBe(false);
    expect(hash).not.toContain('i=');
    const decoded = await decodeStateFromHash(hash);
    expect(decoded.text).toBeUndefined();
    expect(decoded.codes).toEqual(['gpt2']);
  });

  it('fails closed on a malformed link', async () => {
    const decoded = await decodeStateFromHash('#i=g!!!broken&t=gpt2');
    expect(decoded.text).toBeUndefined(); // no throw into the UI
    expect(decoded.codes).toEqual(['gpt2']);
  });

  it('returns nothing for an empty hash', async () => {
    expect(await decodeStateFromHash('')).toEqual({});
    expect(await decodeStateFromHash('#')).toEqual({});
  });
});
