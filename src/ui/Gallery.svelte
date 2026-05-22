<script lang="ts">
  import type { AppState } from '../lib/appState.svelte';

  let { app }: { app: AppState } = $props();
</script>

<section class="gallery">
  <span class="eyebrow">Gallery</span>
  <p class="g-sub">
    Curated inputs, each chosen to make one cross-tokenizer difference obvious. Loading
    a card replaces the input above.
  </p>
  <div class="grid">
    {#each app.gallery as sample (sample.id)}
      <button class="card" onclick={() => app.loadSample(sample.text)}>
        <div class="card-top">
          <span class="ctitle">{sample.title}</span>
          <span class="cat mono">{sample.category}</span>
        </div>
        <p class="why">{sample.why}</p>
        <code class="preview mono"
          >{sample.text.slice(0, 84)}{sample.text.length > 84 ? '…' : ''}</code
        >
      </button>
    {/each}
  </div>
</section>

<style>
  .gallery {
    margin-top: 30px;
  }
  .g-sub {
    margin: 4px 0 12px;
    font-size: 12px;
    color: var(--text-dim);
    max-width: 64ch;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(252px, 1fr));
    gap: 10px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 7px;
    text-align: left;
    background: var(--bg-raised);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 12px 13px;
    transition:
      border-color var(--ms-100),
      transform var(--ms-100);
  }
  .card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .ctitle {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }
  .cat {
    font-size: 9.5px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent);
    white-space: nowrap;
  }
  .why {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--text-dim);
  }
  .preview {
    font-size: 10.5px;
    color: var(--text-faint-solid);
    background: var(--bg-inset);
    border-radius: var(--r-sm);
    padding: 6px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
