/** Message protocol between the main thread and the tokenizer worker. */
import type { TokenizerResult } from '../tokenizers/base';

export type LoadState = 'loading' | 'ready' | 'error';

export interface InitMsg {
  type: 'init';
  /** Absolute base URL the worker resolves same-origin asset paths against. */
  baseHref: string;
}

export interface TokenizeMsg {
  type: 'tokenize';
  reqId: number;
  text: string;
  codes: string[];
}

export type MainToWorker = InitMsg | TokenizeMsg;

export interface StatusMsg {
  type: 'status';
  code: string;
  state: LoadState;
  error?: string;
}

/** One tokenizer's result, streamed as soon as it is ready. */
export interface ResultMsg {
  type: 'result';
  reqId: number;
  result: TokenizerResult;
}

/** Sent once every tokenizer in a request has reported. */
export interface DoneMsg {
  type: 'done';
  reqId: number;
}

export type WorkerToMain = StatusMsg | ResultMsg | DoneMsg;
