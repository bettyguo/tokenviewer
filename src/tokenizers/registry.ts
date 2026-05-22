import type { TokenizerMeta } from './base';

export type EngineKind = 'tiktoken' | 'hf';

/** A tokenizer description plus how to load it. */
export interface TokenizerSpec extends TokenizerMeta {
  engine: EngineKind;
  /**
   * For `tiktoken`: the js-tiktoken encoding name.
   * For `hf`: the asset directory name under `public/tokenizers/<source>/`.
   */
  source: string;
  /** Enabled by default in the UI. */
  defaultOn: boolean;
}

/**
 * The default tokenizer set. Codes are frozen: a shared URL must keep working
 * even if a display name later changes. See docs/TOKENIZER_CHOICES.md.
 *
 * `vocabSize` here is the published reference figure; the loaded adapter
 * reports the exact vocabulary it observes, which the UI prefers when present.
 */
export const TOKENIZERS: TokenizerSpec[] = [
  {
    code: 'gpt2',
    name: 'GPT-2',
    family: 'OpenAI',
    algorithm: 'byte-level BPE',
    vocabSize: 50257,
    reference: 'https://github.com/openai/gpt-2',
    note: 'The 2019 classic. Worst-case baseline for non-English text.',
    engine: 'tiktoken',
    source: 'gpt2',
    defaultOn: true,
  },
  {
    code: 'cl100k',
    name: 'cl100k_base',
    family: 'OpenAI',
    algorithm: 'byte-level BPE',
    vocabSize: 100277,
    reference: 'https://github.com/openai/tiktoken',
    note: 'GPT-3.5 / GPT-4 era encoding.',
    engine: 'tiktoken',
    source: 'cl100k_base',
    defaultOn: true,
  },
  {
    code: 'o200k',
    name: 'o200k_base',
    family: 'OpenAI',
    algorithm: 'byte-level BPE',
    vocabSize: 200019,
    reference: 'https://github.com/openai/tiktoken',
    note: 'GPT-4o / o-series encoding. Much stronger on CJK than cl100k.',
    engine: 'tiktoken',
    source: 'o200k_base',
    defaultOn: true,
  },
  {
    code: 'llama3',
    name: 'Llama 3',
    family: 'Meta',
    algorithm: 'byte-level BPE',
    vocabSize: 128256,
    reference: 'https://huggingface.co/meta-llama/Meta-Llama-3-8B',
    note: 'tiktoken-style 128k BPE; the dominant open-weight family.',
    engine: 'hf',
    source: 'llama3',
    defaultOn: true,
  },
  {
    code: 'deepseek',
    name: 'DeepSeek-V3',
    family: 'DeepSeek',
    algorithm: 'byte-level BPE',
    vocabSize: 129280,
    reference: 'https://huggingface.co/deepseek-ai/DeepSeek-V3',
    note: '128k byte-level BPE from the V3 / R1 family.',
    engine: 'hf',
    source: 'deepseek',
    defaultOn: true,
  },
  {
    code: 'qwen3',
    name: 'Qwen3',
    family: 'Alibaba',
    algorithm: 'byte-level BPE',
    vocabSize: 151669,
    reference: 'https://huggingface.co/Qwen/Qwen3-8B',
    note: 'Large 151k vocab; strong CJK coverage.',
    engine: 'hf',
    source: 'qwen3',
    defaultOn: true,
  },
  {
    code: 'mt5',
    name: 'mT5',
    family: 'Google',
    algorithm: 'SentencePiece unigram',
    vocabSize: 250100,
    reference: 'https://huggingface.co/google/mt5-small',
    note: 'Probabilistic unigram, not BPE. 250k multilingual vocab.',
    engine: 'hf',
    source: 'mt5',
    defaultOn: true,
  },
];

export const TOKENIZER_BY_CODE: ReadonlyMap<string, TokenizerSpec> = new Map(
  TOKENIZERS.map((t) => [t.code, t]),
);

export const DEFAULT_CODES: string[] = TOKENIZERS.filter((t) => t.defaultOn).map(
  (t) => t.code,
);
