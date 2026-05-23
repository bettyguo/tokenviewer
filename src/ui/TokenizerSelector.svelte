<script lang="ts">
  import type { AppState } from '../lib/appState.svelte';
  import { TOKENIZERS } from '../tokenizers/registry';
  import { tokenizerHue } from '../utils/coloring';

  let { app }: { app: AppState } = $props();

  const allCodes = TOKENIZERS.map((t) => t.code);
</script>

<section class="selector">
  <div class="sel-head">
    <h2 class="eyebrow">Tokenizers</h2>
    <div class="sel-actions">
      <button class="link-btn" onclick={() => app.setEnabledCodes([...allCodes])}
        >all</button
      >
      <span class="sep">/</span>
      <button class="link-btn" onclick={() => app.setEnabledCodes([])}>none</button>
    </div>
  </div>

  <div
    class="chips"
    role="group"
    aria-label="Active tokenizers (toggle to enable or disable)"
  >
    {#each TOKENIZERS as spec (spec.code)}
      {@const on = app.enabledCodes.includes(spec.code)}
      {@const st = app.status[spec.code]?.state}
      <button
        class="chip"
        class:on
        onclick={() => app.toggleCode(spec.code)}
        title={spec.note ?? spec.name}
        aria-pressed={on}
      >
        <span
          class="key"
          style:background={on ? tokenizerHue(spec.code) : 'transparent'}
          style:border-color={tokenizerHue(spec.code)}
          aria-hidden="true"
        ></span>
        <span class="name mono">{spec.name}</span>
        <span class="algo">{spec.algorithm.replace('byte-level ', '')}</span>
        {#if on && st === 'loading'}
          <span class="spin" role="status" aria-label="loading {spec.name}"></span>
        {:else if on && st === 'error'}
          <span
            class="err"
            role="img"
            aria-label="failed to load: {app.status[spec.code]?.error ?? 'error'}"
            title={app.status[spec.code]?.error}>!</span
          >
        {/if}
      </button>
    {/each}
  </div>
</section>

<style>
  .selector {
    margin: var(--gap-section) 0 6px;
  }
  .sel-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 9px;
  }
  .sel-actions {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-faint-solid);
  }
  .link-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    padding: 0 2px;
    font-family: var(--font-mono);
    font-size: 11px;
  }
  .link-btn:hover {
    color: var(--accent);
  }
  .sep {
    opacity: 0.4;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 11px;
    background: var(--bg-raised);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    transition: all var(--ms-100);
  }
  .chip:hover {
    border-color: var(--border-strong);
  }
  .chip.on {
    background: var(--bg-hover);
    border-color: var(--border-strong);
  }
  .chip:not(.on) {
    opacity: 0.5;
  }
  .chip:not(.on):hover {
    opacity: 0.85;
  }
  @media (max-width: 600px) {
    .chip {
      padding: 11px 14px;
      min-height: 44px;
    }
  }
  .key {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    border: 1.5px solid;
    flex-shrink: 0;
  }
  .name {
    font-size: 12.5px;
    font-weight: 500;
  }
  .algo {
    font-size: 10px;
    color: var(--text-faint-solid);
    letter-spacing: 0.02em;
  }
  .spin {
    width: 10px;
    height: 10px;
    border: 1.5px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spin {
      animation: none;
      border-top-color: var(--border-strong);
    }
  }
  .err {
    width: 13px;
    height: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--warn);
    color: #fff;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 700;
  }
</style>
