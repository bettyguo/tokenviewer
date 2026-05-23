<script lang="ts">
  import { onMount } from 'svelte';
  import type { TokenizerResult, Token } from '../tokenizers/base';
  import { bytesToHex } from '../tokenizers/base';
  import type { TokenizerSpec } from '../tokenizers/registry';
  import { tokenColor, tokenizerHue } from '../utils/coloring';
  import { tokenSegments } from '../utils/render';
  import Icon from './Icon.svelte';

  let {
    spec,
    result,
    showIds,
  }: { spec: TokenizerSpec; result: TokenizerResult; showIds: boolean } = $props();

  let collapsed = $state(false);
  let hover = $state<{
    token: Token;
    x: number;
    y: number;
    flip: boolean;
  } | null>(null);

  // Cap rendered spans so a very large paste cannot build an unbounded DOM.
  // Token counts in the comparison table remain exact regardless.
  const MAX_RENDER = 1500;
  const shown = $derived(result.tokens.slice(0, MAX_RENDER));
  const truncated = $derived(result.tokens.length - shown.length);

  // Hover shows the tooltip on desktop; mobile browsers fire `mouseenter` on
  // tap for elements with a hover style, so tap-to-inspect works there too.
  // The "token ids" toggle is the keyboard-accessible path to per-token ids.
  const TIP_HALF_WIDTH = 170;

  // Mobile/touch users can open the tooltip by tapping a token (taps fire
  // `mouseenter` on hoverable elements) but have no clean way to dismiss it
  // without tapping another token. Dismiss on any pointerdown outside a
  // `.tok` so taps anywhere else hide the tip.
  onMount(() => {
    const off = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.tok')) hover = null;
    };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  });

  function showTip(token: Token, event: Event): void {
    const r = (event.currentTarget as HTMLElement).getBoundingClientRect();
    // If the token is near the viewport top, flip the tooltip below it
    // instead of above so the tooltip never clips off-screen.
    const flip = r.top < 90;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const cx = r.left + r.width / 2;
    hover = {
      token,
      // Clamp so the tooltip doesn't run off the side on narrow viewports.
      x: Math.min(Math.max(cx, TIP_HALF_WIDTH + 8), vw - TIP_HALF_WIDTH - 8),
      y: flip ? r.bottom : r.top,
      flip,
    };
  }
</script>

<div class="row" style:--hue={tokenizerHue(spec.code)} role="listitem">
  <div class="row-head">
    <button
      class="rh-main"
      onclick={() => (collapsed = !collapsed)}
      aria-expanded={!collapsed}
      aria-label="{spec.name}: {result.error
        ? 'error'
        : `${result.tokens.length} tokens, ${result.byteLength > 0 && result.tokens.length > 0 ? (result.byteLength / result.tokens.length).toFixed(2) : '0'} bytes per token`}. Toggle segmentation."
    >
      <span class="chev" class:open={!collapsed} aria-hidden="true"
        ><Icon name="chevron" size={13} /></span
      >
      <span class="rname mono">{spec.name}</span>
      <span class="rmeta"
        >{spec.algorithm} · vocab {spec.vocabSize.toLocaleString()}</span
      >
    </button>
    <span class="count mono" aria-hidden="true">
      {#if result.error}
        <span class="rerr"><Icon name="alert" size={12} /> {result.error}</span>
      {:else}
        <strong>{result.tokens.length.toLocaleString()}</strong>
        <span class="cu">tokens</span>
        {#if result.byteLength > 0 && result.tokens.length > 0}
          <span class="cbpt"
            >· {(result.byteLength / result.tokens.length).toFixed(2)} B/tok</span
          >
        {/if}
      {/if}
    </span>
  </div>

  {#if !collapsed && !result.error}
    <div class="stream mono" dir="auto" aria-label="Token stream for {spec.name}">
      {#each shown as token (token.index)}
        {@const segs = tokenSegments(token)}
        <!-- The hover tooltip is a non-essential enhancement: the same token
             detail is reachable for keyboard/screen-reader users via the
             "token ids" toggle and the comparison table. A roving-tabindex
             role over hundreds of spans would harm, not help, navigation. -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          class="tok k-{token.kind}"
          style:--c={tokenColor(token.index)}
          onmouseenter={(e) => showTip(token, e)}
          onmouseleave={() => (hover = null)}
        >
          {#each segs as seg, i (i)}
            {#if seg.type === 'space'}<span class="ws"
                >{'·'.repeat(seg.value.length)}</span
              >{:else if seg.type === 'tab'}<span class="ws"
                >{'→'.repeat(seg.value.length)}</span
              >{:else if seg.type === 'newline'}<span class="ws">↵</span
              >{'\n'}{:else if seg.type === 'cr'}<span class="ws">␍</span
              >{:else if seg.type === 'hex'}<span class="hex">{seg.value}</span
              >{:else if seg.type === 'special'}<span class="special">{seg.value}</span
              >{:else}{seg.value}{/if}
          {/each}
          {#if showIds}<sub class="tid">{token.id}</sub>{/if}
        </span>
      {/each}
      {#if truncated > 0}
        <span class="more">+{truncated.toLocaleString()} more tokens not rendered</span>
      {/if}
    </div>
  {/if}
</div>

{#if hover}
  {@const t = hover.token}
  <div
    class="tip mono"
    class:flip={hover.flip}
    style:left="{hover.x}px"
    style:top="{hover.y}px"
    role="tooltip"
  >
    <div class="tip-row"><span>id</span><b>{t.id}</b></div>
    <div class="tip-row"><span>index</span><b>{t.index}</b></div>
    <div class="tip-row">
      <span>text</span><b
        >{t.kind === 'partial' ? '(byte fragment)' : JSON.stringify(t.text)}</b
      >
    </div>
    <div class="tip-row"><span>bytes</span><b>{bytesToHex(t.bytes) || '∅'}</b></div>
    <div class="tip-row"><span>span</span><b>{t.startByte}–{t.endByte}</b></div>
  </div>
{/if}

<style>
  .row {
    border: 1px solid var(--border);
    border-left: 3px solid var(--hue);
    border-radius: 0 var(--r-md) var(--r-md) 0;
    background: var(--bg-raised);
    overflow: hidden;
  }
  .row-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
  }
  .rh-main {
    display: flex;
    align-items: baseline;
    gap: 10px;
    background: none;
    border: none;
    padding: 0;
    flex: 1;
    min-width: 0;
    text-align: left;
  }
  .chev {
    color: var(--text-faint-solid);
    display: inline-flex;
    align-self: center;
    transition: transform var(--ms-100);
  }
  .chev.open {
    transform: rotate(90deg);
  }
  .rname {
    font-size: 14.5px;
    font-weight: 500;
    color: var(--text);
  }
  .rmeta {
    font-size: 11px;
    color: var(--text-faint-solid);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .count {
    font-size: 12px;
    color: var(--text-dim);
    white-space: nowrap;
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
  }
  .count strong {
    color: var(--text);
    font-weight: 600;
    font-size: 15.5px;
  }
  .cu {
    font-size: 11.5px;
    color: var(--text-dim);
    text-transform: lowercase;
    letter-spacing: 0.04em;
  }
  .cbpt {
    font-size: 11px;
    color: var(--text-faint-solid);
  }
  .rerr {
    color: var(--warn);
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }
  .stream {
    padding: 13px 14px;
    font-size: 13.5px;
    line-height: 2.1;
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--bg-inset);
  }
  /* Hue at theme-dependent opacity for separability, plus a 2px gap between
     tokens so a boundary is visible without relying on color (colorblind-safe). */
  .tok {
    border-radius: 3px;
    padding: 2px 1px;
    margin-right: 2px;
    background: color-mix(
      in srgb,
      var(--c) calc(var(--tok-opacity) * 100%),
      transparent
    );
    box-shadow: inset 0 -2px 0 -1px color-mix(in srgb, var(--c) 85%, transparent);
    cursor: default;
    transition: background var(--ms-100);
  }
  .tok:hover {
    background: color-mix(in srgb, var(--c) 72%, transparent);
  }
  .k-whitespace,
  .k-partial {
    background: color-mix(
      in srgb,
      var(--c) calc(var(--tok-opacity) * 65%),
      transparent
    );
  }
  .ws {
    color: var(--text-faint-solid);
    font-size: 0.85em;
  }
  .hex {
    color: var(--warn);
    font-size: 0.82em;
    letter-spacing: 0.02em;
  }
  .special {
    color: var(--accent);
    font-weight: 500;
  }
  .tid {
    font-size: 10.5px;
    color: var(--text-faint-solid);
    vertical-align: sub;
    margin-left: 1px;
    user-select: none;
  }
  .more {
    color: var(--text-faint-solid);
    font-size: 11px;
    font-style: italic;
  }
  .tip {
    position: fixed;
    transform: translate(-50%, calc(-100% - 8px));
    z-index: 50;
    background: var(--bg);
    border: 1px solid var(--border-strong);
    border-radius: var(--r-sm);
    padding: 7px 9px;
    box-shadow: var(--shadow);
    pointer-events: none;
    font-size: 11px;
    min-width: 150px;
    max-width: 320px;
  }
  .tip.flip {
    transform: translate(-50%, 8px);
  }
  .tip-row {
    display: flex;
    gap: 12px;
    justify-content: space-between;
  }
  .tip-row span {
    color: var(--text-faint-solid);
  }
  .tip-row b {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 230px;
  }
</style>
