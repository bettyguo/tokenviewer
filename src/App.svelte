<script lang="ts">
  import { onMount } from 'svelte';
  import { AppState } from './lib/appState.svelte';
  import Header from './ui/Header.svelte';
  import InputPanel from './ui/InputPanel.svelte';
  import StatStrip from './ui/StatStrip.svelte';
  import TokenizerSelector from './ui/TokenizerSelector.svelte';
  import ComparisonView from './ui/ComparisonView.svelte';
  import ComparisonTable from './ui/ComparisonTable.svelte';
  import AnalysisPanels from './ui/AnalysisPanels.svelte';
  import ReferenceCorpus from './ui/ReferenceCorpus.svelte';
  import Gallery from './ui/Gallery.svelte';
  import Footer from './ui/Footer.svelte';

  const app = new AppState();

  onMount(() => {
    void app.init();
    const onPop = () => void app.reloadFromHash();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  });
</script>

<a class="skip-link" href="#main">Skip to main content</a>
<div class="shell">
  <Header {app} />
  <main id="main">
    <InputPanel {app} />
    <StatStrip {app} />
    <TokenizerSelector {app} />
    <ComparisonView {app} />
    <ComparisonTable {app} />
    <AnalysisPanels {app} />
    <ReferenceCorpus />
    <Gallery {app} />
  </main>
  <Footer />
</div>

<style>
  /* Visually hidden until focused via Tab; the very first focusable element
     on the page so a keyboard user can jump past the header in one keystroke. */
  .skip-link {
    position: absolute;
    left: 8px;
    top: -100px;
    z-index: 999;
    background: var(--bg-raised);
    color: var(--accent);
    padding: 9px 14px;
    border: 1px solid var(--accent);
    border-radius: var(--r-sm);
    font-size: 13px;
    text-decoration: none;
  }
  .skip-link:focus {
    top: 8px;
  }
  .shell {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 22px;
  }
  main {
    padding-top: 18px;
  }
  @media (min-width: 1400px) {
    .shell {
      max-width: 1240px;
      padding: 0 26px;
    }
  }
  @media (max-width: 560px) {
    .shell {
      padding: 0 13px;
    }
  }
</style>
