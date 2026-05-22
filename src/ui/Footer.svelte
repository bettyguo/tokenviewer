<script lang="ts">
  import { REPO_URL } from './Header.svelte';
</script>

<footer class="ft">
  <div class="ft-grid">
    <div>
      <span class="eyebrow">Privacy</span>
      <p>
        Every tokenizer runs in your browser. Input text is never sent to a server.
        There is no analytics, no telemetry, and no third-party script — only
        same-origin tokenizer data files are fetched.
      </p>
    </div>
    <div>
      <span class="eyebrow">Built with</span>
      <p>
        <a href="https://github.com/openai/tiktoken" target="_blank" rel="noopener"
          >js-tiktoken</a
        >
        for the OpenAI encodings and
        <a href="https://github.com/lenML/tokenizers" target="_blank" rel="noopener"
          >@lenml/tokenizers</a
        >
        (a tokenizer-only fork of transformers.js) for the Hugging Face tokenizers. Svelte,
        Vite, TypeScript.
      </p>
    </div>
    <div>
      <span class="eyebrow">Project</span>
      <p>
        <a href={REPO_URL} target="_blank" rel="noopener">Source &amp; docs on GitHub</a
        >. MIT licensed. Contributions — new tokenizers, gallery samples — welcome.
      </p>
    </div>
  </div>
  <p class="ft-note mono">
    tokenviewer · working name, not final · no affiliation with OpenAI, Meta, DeepSeek,
    Alibaba, or Google
  </p>
</footer>

<style>
  .ft {
    margin-top: 40px;
    padding: 22px 0 36px;
    border-top: 1px solid var(--border);
  }
  .ft-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 22px;
  }
  .ft-grid p {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--text-dim);
    line-height: 1.6;
  }
  .ft-note {
    margin: 22px 0 0;
    font-size: 10.5px;
    color: var(--text-faint-solid);
  }
</style>
