/**
 * Filesystem asset loader shared by the Node-side scripts (precompute, smoke
 * tests). The browser uses a fetch-based loader instead; both feed the same
 * `TokenizerEngine`.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TokenizerAssets } from '../src/tokenizers/engine';
import { TOKENIZER_BY_CODE } from '../src/tokenizers/registry';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TOKENIZERS_DIR = join(ROOT, 'public', 'tokenizers');

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'));
}

/** Load the assets for one tokenizer code from `public/tokenizers/`. */
export async function loadAssetsFromFs(code: string): Promise<TokenizerAssets> {
  const spec = TOKENIZER_BY_CODE.get(code);
  if (!spec) throw new Error(`Unknown tokenizer code: ${code}`);
  if (spec.engine === 'tiktoken') {
    const ranks = (await readJson(join(TOKENIZERS_DIR, `${code}.json`))) as never;
    return { engine: 'tiktoken', ranks };
  }
  const [tokenizerJSON, tokenizerConfig] = await Promise.all([
    readJson(join(TOKENIZERS_DIR, code, 'tokenizer.json')),
    readJson(join(TOKENIZERS_DIR, code, 'tokenizer_config.json')),
  ]);
  return { engine: 'hf', tokenizerJSON, tokenizerConfig };
}
