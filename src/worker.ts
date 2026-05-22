/**
 * Tokenizer worker. Holds every loaded tokenizer and runs them off the main
 * thread so large inputs never freeze the UI. Tokenizer data is fetched
 * same-origin and lazily — a tokenizer's assets are pulled only when it is
 * first needed.
 */
import { TokenizerEngine, type TokenizerAssets } from './tokenizers/engine';
import { TOKENIZER_BY_CODE } from './tokenizers/registry';
import type { MainToWorker, WorkerToMain } from './lib/protocol';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const engine = new TokenizerEngine();
const loading = new Map<string, Promise<boolean>>();
let baseHref = '';

function send(msg: WorkerToMain): void {
  ctx.postMessage(msg);
}

async function fetchJson(path: string): Promise<unknown> {
  const url = new URL(path, baseHref).href;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

async function fetchAssets(code: string): Promise<TokenizerAssets> {
  const spec = TOKENIZER_BY_CODE.get(code);
  if (!spec) throw new Error(`Unknown tokenizer: ${code}`);
  if (spec.engine === 'tiktoken') {
    const ranks = (await fetchJson(`tokenizers/${code}.json`)) as never;
    return { engine: 'tiktoken', ranks };
  }
  const [tokenizerJSON, tokenizerConfig] = await Promise.all([
    fetchJson(`tokenizers/${code}/tokenizer.json`),
    fetchJson(`tokenizers/${code}/tokenizer_config.json`),
  ]);
  return { engine: 'hf', tokenizerJSON, tokenizerConfig };
}

/** Ensure a tokenizer is loaded; returns false if it could not be. */
function ensureLoaded(code: string): Promise<boolean> {
  if (engine.isLoaded(code)) return Promise.resolve(true);
  const existing = loading.get(code);
  if (existing) return existing;

  const task = (async () => {
    send({ type: 'status', code, state: 'loading' });
    try {
      const assets = await fetchAssets(code);
      engine.load(code, assets);
      send({ type: 'status', code, state: 'ready' });
      return true;
    } catch (err) {
      send({
        type: 'status',
        code,
        state: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    } finally {
      loading.delete(code);
    }
  })();
  loading.set(code, task);
  return task;
}

ctx.onmessage = (event: MessageEvent<MainToWorker>) => {
  const msg = event.data;
  if (msg.type === 'init') {
    baseHref = msg.baseHref;
    return;
  }
  if (msg.type === 'tokenize') {
    const { reqId, text, codes } = msg;
    if (codes.length === 0) {
      send({ type: 'done', reqId });
      return;
    }
    // Stream each result the moment its tokenizer is ready, so the fast
    // OpenAI encodings render immediately instead of waiting for the slow,
    // multi-megabyte HF tokenizer downloads.
    let remaining = codes.length;
    for (const code of codes) {
      void ensureLoaded(code).then((ok) => {
        if (ok) send({ type: 'result', reqId, result: engine.run(text, code) });
        if (--remaining === 0) send({ type: 'done', reqId });
      });
    }
  }
};
