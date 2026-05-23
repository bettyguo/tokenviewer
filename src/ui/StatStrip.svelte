<script lang="ts">
  import type { AppState } from '../lib/appState.svelte';
  import { TOKENIZER_BY_CODE } from '../tokenizers/registry';
  import { tokenizerHue } from '../utils/coloring';

  let { app }: { app: AppState } = $props();

  // Read straight from the efficiency analysis the rest of the UI already
  // computes — this strip is a pure projection, not a second source of truth.
  const eff = $derived(app.efficiency);
  const best = $derived(eff.bestCode ? TOKENIZER_BY_CODE.get(eff.bestCode) : null);
  const worst = $derived(eff.worstCode ? TOKENIZER_BY_CODE.get(eff.worstCode) : null);
  const bestRow = $derived(eff.rows[0]);
  const worstRow = $derived(eff.rows[eff.rows.length - 1]);
</script>

{#if eff.rows.length >= 2 && bestRow && worstRow}
  <div class="strip mono" role="group" aria-label="Cross-tokenizer summary">
    <span class="cell">
      <span class="lbl">tokenizers</span>
      <span class="val">{eff.rows.length}</span>
    </span>
    <span class="cell">
      <span class="lbl">range</span>
      <span class="val">{bestRow.tokenCount} → {worstRow.tokenCount}</span>
    </span>
    <span class="cell highlight">
      <span class="lbl">spread</span>
      <span class="val accent">{eff.spread.toFixed(2)}×</span>
    </span>
    {#if best}
      <span class="cell">
        <span class="lbl">cheapest</span>
        <span class="val">
          <span
            class="dot"
            style:background={tokenizerHue(best.code)}
            aria-hidden="true"
          ></span>
          {best.name}
        </span>
      </span>
    {/if}
    {#if worst}
      <span class="cell">
        <span class="lbl">priciest</span>
        <span class="val">
          <span
            class="dot"
            style:background={tokenizerHue(worst.code)}
            aria-hidden="true"
          ></span>
          {worst.name}
        </span>
      </span>
    {/if}
  </div>
{/if}

<style>
  .strip {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 22px;
    margin: 14px 0 0;
    padding: 12px 4px;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    font-size: 12px;
    color: var(--text-dim);
    align-items: baseline;
  }
  .cell {
    display: inline-flex;
    align-items: baseline;
    gap: 7px;
    white-space: nowrap;
  }
  .lbl {
    color: var(--text-faint-solid);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 10px;
  }
  .val {
    color: var(--text);
    font-weight: 500;
    font-size: 13.5px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .val.accent {
    color: var(--accent);
    font-size: 16px;
    font-weight: 600;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: inline-block;
  }
</style>
