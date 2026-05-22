import type { Token, TokenizerResult } from '../tokenizers/base';
import { utf16ByteOffsets } from '../utils/bytes';

export interface FragmentExample {
  word: string;
  tokenCount: number;
  /** The token texts the word was split into, in order. */
  pieces: string[];
}

export interface FragmentationRow {
  code: string;
  wordsChecked: number;
  wholeWords: number;
  fragmentedWords: number;
  /** Fragmented / checked, in [0, 1]. */
  rate: number;
  worst: FragmentExample[];
}

export interface FragmentationAnalysis {
  applicable: boolean;
  /** Reason shown in the UI when `applicable` is false. */
  reason: string;
  /** Distinct common English words found in the input. */
  wordsFound: number;
  rows: FragmentationRow[];
}

const WORD_RE = /\p{L}[\p{L}'’\-]*/gu;
const MIN_WORDS = 4;

interface WordOccurrence {
  word: string;
  startByte: number;
  endByte: number;
}

/** Tokens whose byte span intersects `[startByte, endByte)`. */
function coveringTokens(tokens: Token[], startByte: number, endByte: number): Token[] {
  return tokens.filter((t) => t.startByte < endByte && t.endByte > startByte);
}

/**
 * Word-fragmentation analysis. Measures how often common English words are
 * kept whole (one token) versus split. Returns `applicable: false` — never a
 * misleading 0% — when the input does not contain enough common English words
 * (CJK, Arabic, symbol-heavy code).
 */
export function analyzeFragmentation(
  results: TokenizerResult[],
  text: string,
  commonWords: ReadonlySet<string>,
): FragmentationAnalysis {
  const byteAt = utf16ByteOffsets(text);
  const occurrences: WordOccurrence[] = [];
  for (const match of text.matchAll(WORD_RE)) {
    const word = match[0].toLowerCase();
    if (!commonWords.has(word)) continue;
    const start = match.index;
    occurrences.push({
      word,
      startByte: byteAt[start],
      endByte: byteAt[start + match[0].length],
    });
  }

  const distinctWords = new Set(occurrences.map((o) => o.word)).size;
  if (occurrences.length < MIN_WORDS) {
    return {
      applicable: false,
      reason:
        'Fewer than four common English words found. Fragmentation needs an ' +
        'English word list, so it is not measured for CJK, Arabic, or ' +
        'symbol-heavy input.',
      wordsFound: distinctWords,
      rows: [],
    };
  }

  const usable = results.filter((r) => !r.error && r.tokens.length > 0);
  const rows: FragmentationRow[] = usable.map((r) => {
    let whole = 0;
    let fragmented = 0;
    const examples: FragmentExample[] = [];
    for (const occ of occurrences) {
      const covering = coveringTokens(r.tokens, occ.startByte, occ.endByte);
      if (covering.length <= 1) {
        whole++;
      } else {
        fragmented++;
        examples.push({
          word: occ.word,
          tokenCount: covering.length,
          pieces: covering.map((t) => t.text),
        });
      }
    }
    examples.sort((a, b) => b.tokenCount - a.tokenCount);
    const seen = new Set<string>();
    const worst = examples
      .filter((e) => !seen.has(e.word) && seen.add(e.word))
      .slice(0, 5);
    const checked = whole + fragmented;
    return {
      code: r.code,
      wordsChecked: checked,
      wholeWords: whole,
      fragmentedWords: fragmented,
      rate: checked > 0 ? +(fragmented / checked).toFixed(4) : 0,
      worst,
    };
  });

  return {
    applicable: true,
    reason: '',
    wordsFound: distinctWords,
    rows,
  };
}
