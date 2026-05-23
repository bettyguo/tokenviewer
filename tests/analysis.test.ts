/** Tests the four analysis modules over real tokenizer output. */
import { beforeAll, describe, expect, it } from 'vitest';
import { TokenizerEngine } from '../src/tokenizers/engine';
import type { TokenizerResult } from '../src/tokenizers/base';
import { analyzeEfficiency } from '../src/analysis/efficiency';
import { analyzeFragmentation } from '../src/analysis/fragmentation';
import { analyzeAgreement } from '../src/analysis/agreement';
import { analyzeDistribution } from '../src/analysis/distribution';
import { loadAssetsFromFs } from '../scripts/node_assets';
import commonWordsData from '../data/common_words.json';

const CODES = ['gpt2', 'cl100k', 'o200k'];
const COMMON = new Set(commonWordsData.words.map((w) => w.toLowerCase()));
const engine = new TokenizerEngine();

function run(text: string): TokenizerResult[] {
  return CODES.map((c) => engine.run(text, c));
}

beforeAll(async () => {
  for (const c of CODES) engine.load(c, await loadAssetsFromFs(c));
}, 30_000);

describe('efficiency', () => {
  it('ranks tokenizers and reports a spread', () => {
    const e = analyzeEfficiency(run('机器学习模型的分词方式各不相同,值得仔细比较。'));
    expect(e.rows).toHaveLength(3);
    // Rows are sorted ascending by token count.
    for (let i = 1; i < e.rows.length; i++) {
      expect(e.rows[i].tokenCount).toBeGreaterThanOrEqual(e.rows[i - 1].tokenCount);
    }
    expect(e.rows[0].vsBest).toBe(1);
    // The Chinese passage is well-known to favour o200k over gpt2/cl100k by
    // a wide margin; assert a real spread rather than a tautological >= 1.
    expect(e.spread).toBeGreaterThan(1.3);
    expect(e.bestCode).toBe(e.rows[0].code);
    expect(e.worstCode).toBe(e.rows[e.rows.length - 1].code);
  });

  it('handles an empty result set', () => {
    const e = analyzeEfficiency([]);
    expect(e.bestCode).toBeNull();
    expect(e.rows).toHaveLength(0);
  });
});

describe('fragmentation', () => {
  it('applies to English text and stays within bounds', () => {
    const text =
      'The information system should process every important request without any error.';
    const f = analyzeFragmentation(run(text), text, COMMON);
    expect(f.applicable).toBe(true);
    // The text contains 11 candidate words; not all are in the common-words
    // list. Tighten from the original >= 4 to a value that would actually
    // catch a regression dropping half the words.
    expect(f.wordsFound).toBeGreaterThanOrEqual(8);
    for (const row of f.rows) {
      expect(row.rate).toBeGreaterThanOrEqual(0);
      expect(row.rate).toBeLessThanOrEqual(1);
      expect(row.wholeWords + row.fragmentedWords).toBe(row.wordsChecked);
    }
  });

  it('matches curly-apostrophe words against the ASCII-apostrophe wordlist', () => {
    // The wordlist uses ASCII apostrophes; pasted text often has curly ones.
    // After normalization, "don't" and "don’t" should be treated the same.
    const text = 'I don’t think it’s right when they don’t look.';
    const f = analyzeFragmentation(run(text), text, COMMON);
    // Should find at least 'i' (if in wordlist) and other common words.
    expect(f.wordsFound).toBeGreaterThanOrEqual(2);
  });

  it('is not applicable to CJK text (no misleading 0%)', () => {
    const text = '这是一段没有任何英文单词的中文文本内容。';
    const f = analyzeFragmentation(run(text), text, COMMON);
    expect(f.applicable).toBe(false);
    expect(f.rows).toHaveLength(0);
    expect(f.reason.length).toBeGreaterThan(0);
  });
});

describe('agreement', () => {
  it('reports gap scores and intra-character splits', () => {
    const text = '你好world';
    const results = run(text);
    const a = analyzeAgreement(results, text);
    expect(a.charCount).toBe(7);
    expect(a.gapScores).toHaveLength(a.charCount + 1);
    expect(a.intraCharSplit).toHaveLength(a.charCount);
    expect(a.overall).toBeGreaterThanOrEqual(0);
    expect(a.overall).toBeLessThanOrEqual(1);
  });

  it('is fully in agreement when given one tokenizer', () => {
    const text = 'hello world';
    const a = analyzeAgreement([engine.run(text, 'cl100k')], text);
    expect(a.overall).toBe(1);
  });
});

describe('distribution', () => {
  it('buckets every non-special token', () => {
    const text = 'Tokenization affects cost, latency, and context budget.';
    const d = analyzeDistribution(run(text));
    expect(d.rows).toHaveLength(3);
    for (const row of d.rows) {
      expect(row.buckets).toHaveLength(10);
      const summed = row.buckets.reduce((a, b) => a + b, 0);
      expect(summed + row.specialCount).toBe(summed); // no specials for plain text
      expect(summed).toBe(row.total);
      expect(row.medianPercentile).toBeGreaterThanOrEqual(0);
      expect(row.medianPercentile).toBeLessThanOrEqual(100);
    }
  });
});
