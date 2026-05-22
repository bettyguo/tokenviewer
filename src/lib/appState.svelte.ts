/**
 * Central application state (Svelte 5 runes). Owns the input, the enabled
 * tokenizer set, results, load status, theme, and URL synchronisation.
 */
import { TokenizerClient } from './tokenizerClient';
import { DEFAULT_CODES } from '../tokenizers/registry';
import type { TokenizerResult } from '../tokenizers/base';
import type { LoadState } from './protocol';
import { decodeStateFromHash, encodeStateToHash } from '../utils/encoding';
import { analyzeEfficiency } from '../analysis/efficiency';
import { analyzeFragmentation } from '../analysis/fragmentation';
import { analyzeAgreement } from '../analysis/agreement';
import { analyzeDistribution } from '../analysis/distribution';
import gallerySamplesData from '../../data/gallery_samples.json';
import commonWordsData from '../../data/common_words.json';

export interface GallerySample {
  id: string;
  title: string;
  why: string;
  category: string;
  text: string;
}

const DEFAULT_SAMPLE =
  'Tokenizers see the same text differently. 同样的文字,不同的切分方式。';

const TOKENIZE_DEBOUNCE_MS = 140;
const URL_DEBOUNCE_MS = 450;

export class AppState {
  text = $state(DEFAULT_SAMPLE);
  enabledCodes = $state<string[]>([...DEFAULT_CODES]);
  status = $state<Record<string, { state: LoadState; error?: string }>>({});
  theme = $state<'dark' | 'light'>('dark');
  pending = $state(false);
  notice = $state('');
  showTokenIds = $state(false);

  /** Latest result per tokenizer code; updated as the worker streams them. */
  private resultsByCode = $state<Record<string, TokenizerResult>>({});

  /** Enabled tokenizers' results, in enabled order, ready ones only. */
  readonly results = $derived(
    this.enabledCodes
      .map((c) => this.resultsByCode[c])
      .filter((r): r is TokenizerResult => r !== undefined),
  );

  readonly gallery: GallerySample[] = gallerySamplesData.samples as GallerySample[];
  readonly commonWords: ReadonlySet<string> = new Set(
    (commonWordsData.words as string[]).map((w) => w.toLowerCase()),
  );

  // Derived analyses — recomputed whenever results (or inputs) change.
  readonly efficiency = $derived(analyzeEfficiency(this.results));
  readonly fragmentation = $derived(
    analyzeFragmentation(this.results, this.text, this.commonWords),
  );
  readonly agreement = $derived(analyzeAgreement(this.results, this.text));
  readonly distribution = $derived(analyzeDistribution(this.results));

  private client: TokenizerClient;
  private currentReqId = 0;
  private tokenizeTimer: ReturnType<typeof setTimeout> | undefined;
  private urlTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.client = new TokenizerClient();
    this.client.onStatus((code, state, error) => {
      this.status = { ...this.status, [code]: { state, error } };
    });
    this.client.onResult((reqId, result) => {
      if (reqId !== this.currentReqId) return; // stale request
      this.resultsByCode = { ...this.resultsByCode, [result.code]: result };
    });
    this.client.onDone((reqId) => {
      if (reqId === this.currentReqId) this.pending = false;
    });
  }

  /** Read theme and state from storage and the URL, then run once. */
  async init(): Promise<void> {
    try {
      const saved = localStorage.getItem('tokenviewer-theme');
      if (saved === 'light' || saved === 'dark') this.theme = saved;
    } catch {
      /* storage unavailable */
    }

    const fromHash = await decodeStateFromHash(location.hash);
    if (fromHash.theme) this.theme = fromHash.theme;
    if (fromHash.codes && fromHash.codes.length > 0) {
      this.enabledCodes = fromHash.codes;
    }
    if (fromHash.text !== undefined) {
      this.text = fromHash.text;
    } else if (location.hash.includes('i=')) {
      this.notice = 'The shared link could not be decoded; starting empty.';
      this.text = '';
    }
    this.applyTheme();
    this.runTokenize();
  }

  /** Re-apply state from the URL hash (used for browser back/forward). */
  async reloadFromHash(): Promise<void> {
    const s = await decodeStateFromHash(location.hash);
    if (s.codes && s.codes.length > 0) this.enabledCodes = s.codes;
    this.text = s.text ?? '';
    this.runTokenize();
  }

  setText(value: string): void {
    this.text = value;
    this.scheduleTokenize();
    this.scheduleUrlSync();
  }

  toggleCode(code: string): void {
    this.enabledCodes = this.enabledCodes.includes(code)
      ? this.enabledCodes.filter((c) => c !== code)
      : [...this.enabledCodes, code];
    this.runTokenize();
    this.scheduleUrlSync();
  }

  setEnabledCodes(codes: string[]): void {
    this.enabledCodes = codes;
    this.runTokenize();
    this.scheduleUrlSync();
  }

  loadSample(text: string): void {
    this.text = text;
    this.notice = '';
    this.runTokenize();
    void this.syncUrl('push');
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    try {
      localStorage.setItem('tokenviewer-theme', this.theme);
    } catch {
      /* storage unavailable */
    }
    this.scheduleUrlSync();
  }

  /** Copy a shareable link to the clipboard. */
  async copyShareLink(): Promise<void> {
    const { hash, inputEmbedded } = await encodeStateToHash({
      text: this.text,
      codes: this.enabledCodes,
      theme: this.theme,
    });
    const url = location.origin + location.pathname + hash;
    try {
      await navigator.clipboard.writeText(url);
      this.notice = inputEmbedded
        ? 'Share link copied to clipboard.'
        : 'Link copied — input too large to embed, so only the tokenizer selection is shared.';
    } catch {
      this.notice =
        'Could not access the clipboard; copy the URL from the address bar.';
    }
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  private scheduleTokenize(): void {
    clearTimeout(this.tokenizeTimer);
    this.tokenizeTimer = setTimeout(() => this.runTokenize(), TOKENIZE_DEBOUNCE_MS);
  }

  /** Fire a tokenization request. Results stream back via the client listeners. */
  private runTokenize(): void {
    this.pending = true;
    this.currentReqId = this.client.tokenize(this.text, this.enabledCodes);
  }

  private scheduleUrlSync(): void {
    clearTimeout(this.urlTimer);
    this.urlTimer = setTimeout(() => void this.syncUrl('replace'), URL_DEBOUNCE_MS);
  }

  private async syncUrl(mode: 'replace' | 'push'): Promise<void> {
    const { hash } = await encodeStateToHash({
      text: this.text,
      codes: this.enabledCodes,
      theme: this.theme,
    });
    const url = location.pathname + location.search + hash;
    if (mode === 'push') history.pushState(null, '', url);
    else history.replaceState(null, '', url);
  }
}
