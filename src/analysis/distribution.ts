import type { TokenizerResult } from '../tokenizers/base';

export interface DistributionRow {
  code: string;
  /** Token counts per vocabulary decile (10 buckets). */
  buckets: number[];
  /** Non-special tokens counted. */
  total: number;
  specialCount: number;
  /** Median id position as a percentage of vocab size, in [0, 100]. */
  medianPercentile: number;
  /** Share of tokens in the top two vocab deciles, in [0, 1]. */
  highIdShare: number;
}

export interface DistributionAnalysis {
  rows: DistributionRow[];
}

const BUCKETS = 10;

/**
 * Token-id distribution by vocabulary decile. A skew toward high ids is a
 * soft hint that the input leans on rarer merges for that tokenizer.
 *
 * Caveat (surfaced in the UI): id order only loosely tracks token frequency —
 * roughly for tiktoken-family merges, weakly for SentencePiece — so the
 * histogram is a hint, not a measurement.
 */
export function analyzeDistribution(results: TokenizerResult[]): DistributionAnalysis {
  const usable = results.filter((r) => !r.error && r.tokens.length > 0);
  const rows: DistributionRow[] = usable.map((r) => {
    const buckets = new Array<number>(BUCKETS).fill(0);
    const percentiles: number[] = [];
    let specialCount = 0;
    const vocab = r.vocabSize > 0 ? r.vocabSize : 1;

    for (const tok of r.tokens) {
      if (tok.kind === 'special') {
        specialCount++;
        continue;
      }
      const frac = Math.min(0.999999, Math.max(0, tok.id / vocab));
      buckets[Math.floor(frac * BUCKETS)]++;
      percentiles.push(frac * 100);
    }

    percentiles.sort((a, b) => a - b);
    const median =
      percentiles.length > 0 ? percentiles[Math.floor(percentiles.length / 2)] : 0;
    const high = buckets[8] + buckets[9];
    const total = percentiles.length;

    return {
      code: r.code,
      buckets,
      total,
      specialCount,
      medianPercentile: +median.toFixed(1),
      highIdShare: total > 0 ? +(high / total).toFixed(4) : 0,
    };
  });
  return { rows };
}
