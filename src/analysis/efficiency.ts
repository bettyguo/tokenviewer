import type { TokenizerResult } from '../tokenizers/base';

export interface EfficiencyRow {
  code: string;
  tokenCount: number;
  /** Code points per token. Higher is more efficient. */
  charsPerToken: number;
  /** UTF-8 bytes per token. Higher is more efficient. */
  bytesPerToken: number;
  /** Token count relative to the most efficient tokenizer for this input. */
  vsBest: number;
}

export interface EfficiencyAnalysis {
  rows: EfficiencyRow[];
  bestCode: string | null;
  worstCode: string | null;
  /** Worst/best token-count ratio — the spread for this input. */
  spread: number;
}

/**
 * Per-tokenizer efficiency for one input. Tokenizers that failed or produced
 * no tokens are skipped (they cannot have a meaningful ratio).
 */
export function analyzeEfficiency(results: TokenizerResult[]): EfficiencyAnalysis {
  const usable = results.filter((r) => !r.error && r.tokens.length > 0);
  if (usable.length === 0) {
    return { rows: [], bestCode: null, worstCode: null, spread: 1 };
  }
  const minTokens = Math.min(...usable.map((r) => r.tokens.length));
  const maxTokens = Math.max(...usable.map((r) => r.tokens.length));

  const rows: EfficiencyRow[] = usable.map((r) => {
    const tokenCount = r.tokens.length;
    return {
      code: r.code,
      tokenCount,
      charsPerToken: +(r.charLength / tokenCount).toFixed(3),
      bytesPerToken: +(r.byteLength / tokenCount).toFixed(3),
      vsBest: +(tokenCount / minTokens).toFixed(3),
    };
  });
  rows.sort((a, b) => a.tokenCount - b.tokenCount);

  return {
    rows,
    bestCode: rows[0]?.code ?? null,
    worstCode: rows[rows.length - 1]?.code ?? null,
    spread: +(maxTokens / minTokens).toFixed(3),
  };
}
