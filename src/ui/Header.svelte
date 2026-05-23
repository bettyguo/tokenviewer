<script lang="ts" module>
  export const REPO_URL = 'https://github.com/bettyguo/tokenviewer';
</script>

<script lang="ts">
  import type { AppState } from '../lib/appState.svelte';
  import Icon from './Icon.svelte';

  let { app }: { app: AppState } = $props();
</script>

<header class="hdr">
  <div class="brand">
    <h1 class="wordmark mono">
      tokenviewer<span class="caret" aria-hidden="true">_</span>
    </h1>
    <p class="tagline">
      Nine LLM tokenizers, one paragraph — see who pays the token tax.
    </p>
  </div>

  <div class="hdr-right">
    <span
      class="privacy"
      title="No text is sent anywhere. All tokenization runs locally."
    >
      <span class="dot" aria-hidden="true"></span>
      runs in your browser
    </span>
    <button
      class="ibtn"
      onclick={() => app.toggleTheme()}
      aria-label="Toggle color theme"
      title="Toggle theme"
    >
      <Icon name={app.theme === 'dark' ? 'sun' : 'moon'} />
    </button>
    <a
      class="ibtn"
      href={REPO_URL}
      target="_blank"
      rel="noopener"
      aria-label="Source on GitHub"
    >
      <Icon name="github" />
    </a>
  </div>
</header>

<style>
  .hdr {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding: 18px 0 14px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .wordmark {
    font-size: 26px;
    font-weight: 500;
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1;
  }
  @media (min-width: 720px) {
    .wordmark {
      font-size: 30px;
    }
  }
  .caret {
    color: var(--accent);
    animation: blink 1.3s steps(1) infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .caret {
      animation: none;
    }
  }
  .tagline {
    margin: 6px 0 0;
    color: var(--text);
    font-size: 15px;
    font-weight: 400;
    line-height: 1.4;
    max-width: 56ch;
    letter-spacing: -0.005em;
  }
  .hdr-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .privacy {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    padding: 5px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--good);
    box-shadow: 0 0 4px color-mix(in srgb, var(--good) 60%, transparent);
  }
  .ibtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--bg-raised);
    color: var(--text-dim);
    transition:
      color var(--ms-100),
      border-color var(--ms-100);
  }
  .ibtn:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }
  @media (max-width: 600px) {
    .ibtn {
      width: 44px;
      height: 44px;
    }
  }
</style>
