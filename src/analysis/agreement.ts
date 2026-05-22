import type { TokenizerResult } from '../tokenizers/base';
import { codePointAtByte, codePointByteBoundaries } from '../utils/bytes';

export interface ContestedSpan {
  /** A short window of input text around the contested boundary. */
  text: string;
  /** Fraction of tokenizers that placed a boundary here, in [0, 1]. */
  score: number;
  charIndex: number;
}

export interface AgreementAnalysis {
  charCount: number;
  tokenizerCount: number;
  /**
   * Boundary-agreement score per inter-character gap. Length `charCount + 1`;
   * `gapScores[g]` is the gap before code point `g`. The two edges are 1.
   */
  gapScores: number[];
  /** Per code point: how many tokenizers split *inside* that character. */
  intraCharSplit: number[];
  /** Mean agreement over gaps where at least one tokenizer cut. */
  overall: number;
  /** The most-contested boundaries, worst first. */
  contested: ContestedSpan[];
}

/**
 * Cross-tokenizer agreement: where in the input do tokenizers place the same
 * token boundaries, and where do they diverge? Works on raw byte offsets, so
 * it also surfaces splits that fall *inside* a multi-byte character (common
 * for CJK under byte-level BPE).
 */
export function analyzeAgreement(
  results: TokenizerResult[],
  text: string,
): AgreementAnalysis {
  const usable = results.filter((r) => !r.error && r.tokens.length > 0);
  const boundaries = codePointByteBoundaries(text);
  const charCount = boundaries.length - 1;
  const boundarySet = new Set(boundaries);
  const total = usable.length;

  const gapScores = new Array<number>(charCount + 1).fill(1);
  const intraCharSplit = new Array<number>(Math.max(charCount, 0)).fill(0);

  if (total === 0 || charCount === 0) {
    return {
      charCount,
      tokenizerCount: total,
      gapScores,
      intraCharSplit,
      overall: 1,
      contested: [],
    };
  }

  // Per-gap tally of how many tokenizers placed a boundary there.
  const gapHits = new Array<number>(charCount + 1).fill(0);
  for (const r of usable) {
    const seenChars = new Set<number>();
    for (let i = 0; i < r.tokens.length - 1; i++) {
      const e = r.tokens[i].endByte;
      if (boundarySet.has(e)) {
        // Boundary lands cleanly between two code points.
        const g = codePointAtByte(boundaries, e);
        gapHits[g]++;
      } else {
        // Boundary falls inside a character — count it once per tokenizer.
        const ci = codePointAtByte(boundaries, e);
        if (!seenChars.has(ci)) {
          seenChars.add(ci);
          if (ci < charCount) intraCharSplit[ci]++;
        }
      }
    }
  }

  let candidateSum = 0;
  let candidateCount = 0;
  for (let g = 1; g < charCount; g++) {
    if (gapHits[g] > 0) {
      gapScores[g] = gapHits[g] / total;
      candidateSum += gapScores[g];
      candidateCount++;
    } else {
      gapScores[g] = 0;
    }
  }

  const chars = Array.from(text);
  const contested: ContestedSpan[] = [];
  for (let g = 1; g < charCount; g++) {
    if (gapHits[g] > 0 && gapScores[g] < 1) {
      contested.push({
        charIndex: g,
        score: gapScores[g],
        text: chars.slice(Math.max(0, g - 3), g + 3).join(''),
      });
    }
  }
  contested.sort((a, b) => a.score - b.score);

  return {
    charCount,
    tokenizerCount: total,
    gapScores,
    intraCharSplit,
    overall: candidateCount > 0 ? +(candidateSum / candidateCount).toFixed(4) : 1,
    contested: contested.slice(0, 6),
  };
}
