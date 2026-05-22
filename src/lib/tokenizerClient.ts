/** Main-thread client for the tokenizer worker. */
import TokenizeWorker from '../worker?worker';
import type { TokenizerResult } from '../tokenizers/base';
import type { LoadState, MainToWorker, WorkerToMain } from './protocol';

export type StatusListener = (code: string, state: LoadState, error?: string) => void;
export type ResultListener = (reqId: number, result: TokenizerResult) => void;
export type DoneListener = (reqId: number) => void;

/**
 * Wraps the tokenizer worker. Results stream in one tokenizer at a time via
 * `onResult`; `onDone` fires once a request has fully completed. Callers track
 * the latest `reqId` to discard stale streamed results.
 */
export class TokenizerClient {
  private readonly worker: Worker;
  private reqCounter = 0;
  private statusListener: StatusListener | undefined;
  private resultListener: ResultListener | undefined;
  private doneListener: DoneListener | undefined;

  constructor() {
    this.worker = new TokenizeWorker();
    this.worker.onmessage = (e: MessageEvent<WorkerToMain>) => this.onMessage(e.data);
    const baseHref = new URL(import.meta.env.BASE_URL, location.href).href;
    this.post({ type: 'init', baseHref });
  }

  onStatus(listener: StatusListener): void {
    this.statusListener = listener;
  }

  onResult(listener: ResultListener): void {
    this.resultListener = listener;
  }

  onDone(listener: DoneListener): void {
    this.doneListener = listener;
  }

  /** Start a tokenization request; returns its id for staleness checks. */
  tokenize(text: string, codes: string[]): number {
    const reqId = ++this.reqCounter;
    // `codes` may be a Svelte reactive proxy, which structured-clone (and so
    // postMessage) cannot transfer — send a plain copy.
    this.post({ type: 'tokenize', reqId, text: String(text), codes: [...codes] });
    return reqId;
  }

  private post(msg: MainToWorker): void {
    this.worker.postMessage(msg);
  }

  private onMessage(msg: WorkerToMain): void {
    if (msg.type === 'status') {
      this.statusListener?.(msg.code, msg.state, msg.error);
    } else if (msg.type === 'result') {
      this.resultListener?.(msg.reqId, msg.result);
    } else {
      this.doneListener?.(msg.reqId);
    }
  }
}
