<script lang="ts">
  import type { AppState } from '../lib/appState.svelte';
  import { TOKENIZER_BY_CODE } from '../tokenizers/registry';
  import { tokenizerHue } from '../utils/coloring';
  import Panel from './Panel.svelte';

  let { app }: { app: AppState } = $props();

  const name = (code: string) => TOKENIZER_BY_CODE.get(code)?.name ?? code;

  const eff = $derived(app.efficiency);
  const frag = $derived(app.fragmentation);
  const agree = $derived(app.agreement);
  const dist = $derived(app.distribution);

  const maxTokens = $derived(Math.max(...eff.rows.map((r) => r.tokenCount), 1));
  const maxBucket = $derived(Math.max(...dist.rows.flatMap((r) => r.buckets), 1));
  const fragWorst = $derived(
    frag.applicable ? [...frag.rows].sort((a, b) => b.rate - a.rate)[0] : undefined,
  );
  // Agreement strip: cap rendered characters for performance.
  const stripChars = $derived(Array.from(app.text).slice(0, 480));
</script>

<section class="ap">
  <span class="eyebrow">Analysis</span>
  <div class="ap-list">
    <!-- Efficiency ------------------------------------------------------ -->
    <Panel
      title="Efficiency"
      summary={eff.rows.length
        ? `${eff.spread.toFixed(2)}x spread · best: ${name(eff.bestCode ?? '')}`
        : 'no data'}
    >
      {#if eff.rows.length}
        <div class="bars">
          {#each eff.rows as r (r.code)}
            <div class="bar-row">
              <span class="bl mono">{name(r.code)}</span>
              <div class="track">
                <div
                  class="fill"
                  style:width="{(r.tokenCount / maxTokens) * 100}%"
                  style:background={tokenizerHue(r.code)}
                ></div>
              </div>
              <span class="bv mono">{r.tokenCount}</span>
              <span class="mult mono" class:flag={r.vsBest > 1.5}>
                {r.vsBest.toFixed(2)}x
              </span>
            </div>
          {/each}
        </div>
        <p class="explain">
          Token count for this input, and each tokenizer's count relative to the most
          efficient one. Bytes per token: {eff.rows
            .map((r) => `${name(r.code)} ${r.bytesPerToken.toFixed(2)}`)
            .join(' · ')}.
        </p>
      {/if}
    </Panel>

    <!-- Fragmentation --------------------------------------------------- -->
    <Panel
      title="Word fragmentation"
      summary={frag.applicable
        ? `${frag.wordsFound} common words found`
        : 'not applicable'}
    >
      {#if !frag.applicable}
        <p class="explain">{frag.reason}</p>
      {:else}
        <div class="frag-grid">
          {#each frag.rows as r (r.code)}
            <div class="frag-row">
              <span class="bl mono">{name(r.code)}</span>
              <div class="track">
                <div
                  class="fill"
                  style:width="{r.rate * 100}%"
                  style:background={tokenizerHue(r.code)}
                ></div>
              </div>
              <span class="bv mono">{(r.rate * 100).toFixed(0)}%</span>
              <span class="frac mono">{r.fragmentedWords}/{r.wordsChecked} split</span>
            </div>
          {/each}
        </div>
        {#if fragWorst && fragWorst.worst.length}
          <p class="explain">
            Most-split words for {name(fragWorst.code)}:
            {#each fragWorst.worst as w (w.word)}
              <span class="wchip">
                {w.word}
                <span class="wn">→ {w.tokenCount}</span>
              </span>
            {/each}
          </p>
        {/if}
      {/if}
    </Panel>

    <!-- Agreement ------------------------------------------------------- -->
    <Panel
      title="Cross-tokenizer agreement"
      summary={`${(agree.overall * 100).toFixed(0)}% mean agreement`}
    >
      <p class="explain">
        Of every position where some tokenizer placed a token boundary,
        {(agree.overall * 100).toFixed(0)}% were placed by all
        {agree.tokenizerCount} tokenizers. Brighter marks below are higher-disagreement boundaries.
      </p>
      {#if stripChars.length}
        <div class="strip mono">
          {#each stripChars as ch, i (i)}
            {@const gap = agree.gapScores[i] ?? 1}
            {#if i > 0}
              <span
                class="gap"
                style:opacity={gap >= 1 ? 0.06 : 1 - gap}
                title="{Math.round(gap * 100)}% agree"
              ></span>
            {/if}
            <span class="gch" class:split={(agree.intraCharSplit[i] ?? 0) > 0}
              >{ch}</span
            >
          {/each}
        </div>
      {/if}
      {#if agree.contested.length}
        <p class="explain">
          Most contested:
          {#each agree.contested as c (c.charIndex)}
            <span class="wchip"
              >{c.text}<span class="wn">{Math.round(c.score * 100)}%</span></span
            >
          {/each}
        </p>
      {/if}
    </Panel>

    <!-- Distribution ---------------------------------------------------- -->
    <Panel
      title="Token-id distribution"
      summary={dist.rows.length ? 'id deciles' : 'no data'}
    >
      <div class="dist">
        {#each dist.rows as r (r.code)}
          <div class="dist-row">
            <span class="bl mono">{name(r.code)}</span>
            <div class="hist">
              {#each r.buckets as b, i (i)}
                <div
                  class="hbar"
                  style:height="{(b / maxBucket) * 100}%"
                  style:background={tokenizerHue(r.code)}
                  title="decile {i + 1}: {b} tokens"
                ></div>
              {/each}
            </div>
            <span class="dmeta mono">
              median {r.medianPercentile.toFixed(0)}% · top-decile {(
                r.highIdShare * 100
              ).toFixed(0)}%
            </span>
          </div>
        {/each}
      </div>
      <p class="explain caveat">
        Each bar is a vocabulary decile (low ids left, high ids right). A skew right
        hints the input leans on rarer merges. Caveat: id order only loosely tracks
        token frequency, so read this as a hint, not a measurement.
      </p>
    </Panel>
  </div>
</section>

<style>
  .ap {
    margin-top: 22px;
  }
  .ap-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 9px;
  }
  .bars,
  .frag-grid,
  .dist {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-top: 10px;
  }
  .bar-row,
  .frag-row,
  .dist-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .bl {
    width: 96px;
    flex-shrink: 0;
    font-size: 11.5px;
    color: var(--text-dim);
    text-align: right;
  }
  .track {
    flex: 1;
    height: 14px;
    background: var(--bg-inset);
    border-radius: 3px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 3px;
    min-width: 2px;
    transition: width var(--ms-200);
  }
  .bv {
    width: 44px;
    text-align: right;
    font-size: 11.5px;
  }
  .mult {
    width: 50px;
    text-align: right;
    font-size: 11px;
    color: var(--text-faint-solid);
  }
  .mult.flag {
    color: var(--warn);
  }
  .frac {
    width: 96px;
    font-size: 10.5px;
    color: var(--text-faint-solid);
  }
  .explain {
    margin: 12px 0 0;
    font-size: 11.5px;
    color: var(--text-dim);
    line-height: 1.6;
  }
  .caveat {
    color: var(--text-faint-solid);
  }
  .wchip {
    display: inline-block;
    background: var(--bg-inset);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 1px 6px;
    margin: 2px 3px 0 0;
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text);
  }
  .wn {
    color: var(--accent);
    margin-left: 4px;
  }
  .strip {
    margin-top: 11px;
    padding: 10px;
    background: var(--bg-inset);
    border-radius: var(--r-sm);
    font-size: 14px;
    line-height: 2;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .gap {
    display: inline-block;
    width: 2px;
    height: 1.1em;
    vertical-align: text-bottom;
    background: var(--accent);
    margin: 0 -1px;
    border-radius: 1px;
  }
  .gch.split {
    box-shadow: inset 0 -2px 0 0 var(--warn);
  }
  .hist {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 34px;
    padding: 2px 0;
  }
  .hbar {
    flex: 1;
    min-height: 1px;
    border-radius: 1px 1px 0 0;
    opacity: 0.85;
  }
  .dmeta {
    width: 190px;
    flex-shrink: 0;
    font-size: 10.5px;
    color: var(--text-faint-solid);
    text-align: right;
  }
</style>
