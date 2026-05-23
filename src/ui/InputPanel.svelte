<script lang="ts">
  import type { AppState } from '../lib/appState.svelte';
  import { byteLength, charLength } from '../tokenizers/base';
  import { formatBytes } from '../utils/bytes';
  import Icon from './Icon.svelte';

  let { app }: { app: AppState } = $props();

  const QUICK_SAMPLES: { label: string; text: string }[] = [
    {
      label: 'English',
      text: 'The quick brown fox jumps over the lazy dog while the tokenizer counts every piece.',
    },
    {
      label: '中文',
      text: '分词器决定了模型如何看待文本,不同的分词器对同一段中文的切分方式差别很大。',
    },
    {
      label: 'Code',
      text: 'const total = items.reduce((sum, x) => sum + x.value, 0);',
    },
  ];

  const chars = $derived(charLength(app.text));
  const bytes = $derived(byteLength(app.text));
  const words = $derived(app.text.trim() ? app.text.trim().split(/\s+/u).length : 0);

  let fileInput: HTMLInputElement;
  const MAX_FILE_BYTES = 1_000_000;

  async function onFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) {
        app.notice = `File too large (${(file.size / 1024).toFixed(0)} KB) — keep it under 1 MB.`;
        return;
      }
      const text = await file.text();
      app.loadSample(text);
    } catch (err) {
      app.notice = `Could not read file: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      if (fileInput) fileInput.value = '';
    }
  }
</script>

<section class="panel input-panel">
  <div class="ip-head">
    <h2 class="eyebrow">Input</h2>
    <span id="ip-counts" class="counts mono">
      {chars.toLocaleString()} chars · {formatBytes(bytes)} · {words.toLocaleString()} words
    </span>
  </div>

  <textarea
    class="mono"
    spellcheck="false"
    autocapitalize="off"
    autocomplete="off"
    dir="auto"
    placeholder="Paste or type text to tokenize…"
    aria-label="Text to tokenize"
    aria-describedby="ip-counts"
    value={app.text}
    oninput={(e) => app.setText((e.currentTarget as HTMLTextAreaElement).value)}
  ></textarea>

  <div class="toolbar">
    <div class="samples">
      <span class="tb-label">Samples</span>
      {#each QUICK_SAMPLES as s (s.label)}
        <button class="chip-btn" onclick={() => app.loadSample(s.text)}
          >{s.label}</button
        >
      {/each}
    </div>
    <div class="tb-actions">
      <button class="chip-btn" onclick={() => fileInput.click()}>
        <Icon name="upload" size={13} /> File
      </button>
      <button
        class="chip-btn"
        onclick={() => app.copyShareLink()}
        title="Copy a shareable link to this comparison"
      >
        <Icon name="link" size={13} /> Share
      </button>
      <button
        class="chip-btn danger"
        onclick={() => app.loadSample('')}
        disabled={app.text.length === 0}
      >
        <Icon name="trash" size={13} /> Clear
      </button>
      <input
        bind:this={fileInput}
        type="file"
        accept=".txt,.md,.json,.py,.js,.ts,.tsx,.csv,.html,.css,.xml,.yaml,.yml,text/*"
        onchange={onFile}
        hidden
      />
    </div>
  </div>

  {#if app.notice}
    <div class="notice" role="status" aria-live="polite">
      <Icon name="alert" size={13} />
      <span>{app.notice}</span>
      <button
        class="notice-x"
        onclick={() => (app.notice = '')}
        aria-label="Dismiss notice">×</button
      >
    </div>
  {/if}
</section>

<style>
  .input-panel {
    padding: 14px 16px 16px;
  }
  .ip-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 9px;
  }
  .counts {
    font-size: 11.5px;
    color: var(--text-dim);
  }
  textarea {
    width: 100%;
    min-height: 132px;
    resize: vertical;
    background: var(--bg-inset);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 11px 12px;
    font-size: 13.5px;
    line-height: 1.6;
  }
  textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  .toolbar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 11px;
    flex-wrap: wrap;
  }
  .samples,
  .tb-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .tb-label {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-faint-solid);
    margin-right: 2px;
  }
  .chip-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--bg-raised);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 5px 10px;
    font-size: 12px;
    color: var(--text-dim);
    transition: all var(--ms-100);
    min-height: 28px;
  }
  @media (max-width: 600px) {
    .chip-btn {
      padding: 11px 14px;
      font-size: 13px;
      min-height: 44px;
    }
    .tb-label {
      display: none;
    }
  }
  .chip-btn:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--border-strong);
    background: var(--bg-hover);
  }
  .chip-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .chip-btn.danger:hover:not(:disabled) {
    color: var(--warn);
    border-color: var(--warn);
  }
  .notice {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 11px;
    padding: 8px 10px;
    background: var(--accent-soft);
    border: 1px solid var(--accent);
    border-radius: var(--r-sm);
    font-size: 12.5px;
    color: var(--text);
  }
  .notice-x {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 18px;
    line-height: 1;
    min-width: 32px;
    min-height: 32px;
    padding: 4px 8px;
    border-radius: var(--r-sm);
  }
  .notice-x:hover {
    color: var(--text);
    background: var(--bg-hover);
  }
</style>
