<script lang="ts">
  import type { AppState } from '../lib/appState.svelte';
  import { TOKENIZERS } from '../tokenizers/registry';
  import { tokenizerHue } from '../utils/coloring';
  import TokenizerRow from './TokenizerRow.svelte';

  let { app }: { app: AppState } = $props();

  // Enabled tokenizers in canonical registry order.
  const ordered = $derived(TOKENIZERS.filter((s) => app.enabledCodes.includes(s.code)));
  const resultByCode = $derived(new Map(app.results.map((r) => [r.code, r])));

  /** Short audible summary for screen-reader users — read aloud whenever
   * results settle. Updates politely so a typist isn't interrupted. */
  const liveSummary = $derived.by(() => {
    if (app.text.length === 0 || app.results.length === 0) return '';
    const parts = app.results.map((r) => `${r.code} ${r.tokens.length}`);
    return `Tokenized: ${parts.join(', ')} tokens.`;
  });
</script>

<section class="cv" aria-labelledby="cv-h-id">
  <div class="cv-head">
    <div class="cv-title">
      <h2 id="cv-h-id" class="cv-h">Segmentation</h2>
      <span class="cv-sub">how each tokenizer split your input — colored by token</span>
    </div>
    <button
      class="toggle"
      class:on={app.showTokenIds}
      onclick={() => (app.showTokenIds = !app.showTokenIds)}
      aria-pressed={app.showTokenIds}
    >
      token ids: {app.showTokenIds ? 'on' : 'off'}
    </button>
  </div>

  <!-- Screen-reader-only announcement of per-tokenizer counts.
       Polite so it doesn't interrupt typing; only updates as new results land. -->
  <div class="sr-only" aria-live="polite" aria-atomic="true">{liveSummary}</div>

  {#if app.enabledCodes.length === 0}
    <div class="empty">No tokenizers selected. Enable one above to compare.</div>
  {:else if app.text.length === 0}
    <div class="empty">
      Paste text, pick a sample, or open the gallery below to see how each tokenizer
      splits it.
    </div>
  {:else}
    <div class="rows" role="list" aria-label="Per-tokenizer results">
      {#each ordered as spec (spec.code)}
        {@const result = resultByCode.get(spec.code)}
        {#if result}
          <TokenizerRow {spec} {result} showIds={app.showTokenIds} />
        {:else}
          {@const st = app.status[spec.code]}
          <div class="ph" style:--hue={tokenizerHue(spec.code)}>
            <span class="ph-key"></span>
            <span class="mono">{spec.name}</span>
            <span class="ph-state">
              {#if st?.state === 'error'}
                failed to load — {st.error}
              {:else}
                loading tokenizer…
              {/if}
            </span>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</section>

<style>
  .cv {
    margin-top: var(--gap-section);
  }
  .cv-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .cv-title {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }
  .cv-h {
    margin: 0;
    font-size: 17px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--text);
  }
  .cv-sub {
    font-size: 12px;
    color: var(--text-faint-solid);
  }
  .toggle {
    background: var(--bg-raised);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 4px 9px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  .toggle.on {
    color: var(--accent);
    border-color: var(--accent);
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .empty {
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-md);
    padding: 28px 20px;
    text-align: center;
    color: var(--text-dim);
    font-size: 13px;
  }
  .ph {
    display: flex;
    align-items: center;
    gap: 9px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--hue);
    border-radius: 0 var(--r-md) var(--r-md) 0;
    background: var(--bg-raised);
    padding: 11px 12px;
    font-size: 12px;
  }
  .ph-key {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--hue);
    opacity: 0.65;
  }
  .ph-state {
    color: var(--text-faint-solid);
  }
</style>
