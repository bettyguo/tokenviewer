<script lang="ts">
  import { onMount } from 'svelte';
  import { AppState } from './lib/appState.svelte';
  import Header from './ui/Header.svelte';
  import InputPanel from './ui/InputPanel.svelte';
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

<div class="shell">
  <Header {app} />
  <main>
    <InputPanel {app} />
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
  .shell {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 22px;
  }
  main {
    padding-top: 18px;
  }
  @media (max-width: 560px) {
    .shell {
      padding: 0 13px;
    }
  }
</style>
