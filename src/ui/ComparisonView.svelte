<script lang="ts">
  import type { AppState } from '../lib/appState.svelte';
  import { TOKENIZERS } from '../tokenizers/registry';
  import { tokenizerHue } from '../utils/coloring';
  import TokenizerRow from './TokenizerRow.svelte';

  let { app }: { app: AppState } = $props();

  // Enabled tokenizers in canonical registry order.
  const ordered = $derived(TOKENIZERS.filter((s) => app.enabledCodes.includes(s.code)));
  const resultByCode = $derived(new Map(app.results.map((r) => [r.code, r])));
</script>

<section class="cv">
  <div class="cv-head">
    <span class="eyebrow">Segmentation</span>
    <button
      class="toggle"
      class:on={app.showTokenIds}
      onclick={() => (app.showTokenIds = !app.showTokenIds)}
      aria-pressed={app.showTokenIds}
    >
      token ids: {app.showTokenIds ? 'on' : 'off'}
    </button>
  </div>

  {#if app.enabledCodes.length === 0}
    <div class="empty">No tokenizers selected. Enable one above to compare.</div>
  {:else if app.text.length === 0}
    <div class="empty">
      Paste text, pick a sample, or open the gallery below to see how each tokenizer
      splits it.
    </div>
  {:else}
    <div class="rows">
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
    margin-top: 22px;
  }
  .cv-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
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
    border-radius: var(--r-md);
    background: var(--bg-raised);
    padding: 11px 12px;
    font-size: 12px;
  }
  .ph-key {
    width: 11px;
    height: 11px;
    border-radius: 3px;
    background: var(--hue);
    opacity: 0.5;
  }
  .ph-state {
    color: var(--text-faint-solid);
  }
</style>
