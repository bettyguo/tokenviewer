<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  let {
    title,
    summary = '',
    open = $bindable(false),
    children,
  }: {
    title: string;
    summary?: string;
    open?: boolean;
    children: Snippet;
  } = $props();
</script>

<section class="apanel">
  <button class="phead" onclick={() => (open = !open)} aria-expanded={open}>
    <span class="chev" class:open><Icon name="chevron" size={13} /></span>
    <span class="ptitle">{title}</span>
    {#if summary}<span class="psum mono">{summary}</span>{/if}
  </button>
  {#if open}
    <div class="pbody">{@render children()}</div>
  {/if}
</section>

<style>
  .apanel {
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--bg-raised);
    overflow: hidden;
  }
  .phead {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    background: none;
    border: none;
    padding: 11px 13px;
    text-align: left;
  }
  .phead:hover {
    background: var(--bg-hover);
  }
  .chev {
    color: var(--text-faint-solid);
    display: inline-flex;
    transition: transform var(--ms-100);
  }
  .chev.open {
    transform: rotate(90deg);
  }
  .ptitle {
    font-size: 13px;
    font-weight: 500;
  }
  .psum {
    margin-left: auto;
    font-size: 11.5px;
    color: var(--text-dim);
    text-align: right;
  }
  .pbody {
    padding: 4px 14px 16px;
    border-top: 1px solid var(--border);
  }
</style>
