<script lang="ts">
  import type { AppState } from '../lib/appState.svelte';
  import { TOKENIZER_BY_CODE } from '../tokenizers/registry';
  import { tokenizerHue } from '../utils/coloring';

  let { app }: { app: AppState } = $props();

  interface Row {
    code: string;
    name: string;
    tokens: number;
    charsPerTok: number;
    bytesPerTok: number;
    longestText: string;
    longestBytes: number;
    fragRate: number | null;
  }

  type SortKey = 'name' | 'tokens' | 'charsPerTok' | 'bytesPerTok' | 'fragRate';
  let sortKey = $state<SortKey>('tokens');
  let sortAsc = $state(true);

  function clip(s: string, n: number): string {
    const arr = Array.from(s);
    return arr.length > n ? arr.slice(0, n).join('') + '…' : s;
  }

  const rows = $derived.by((): Row[] => {
    const fragByCode = new Map(
      app.fragmentation.applicable
        ? app.fragmentation.rows.map((r) => [r.code, r.rate])
        : [],
    );
    return app.results
      .filter((r) => !r.error && r.tokens.length > 0)
      .map((r): Row => {
        let longest = r.tokens[0];
        for (const t of r.tokens)
          if (t.bytes.length > longest.bytes.length) longest = t;
        return {
          code: r.code,
          name: TOKENIZER_BY_CODE.get(r.code)?.name ?? r.code,
          tokens: r.tokens.length,
          charsPerTok: +(r.charLength / r.tokens.length).toFixed(2),
          bytesPerTok: +(r.byteLength / r.tokens.length).toFixed(2),
          longestText:
            longest.kind === 'partial'
              ? '(byte fragment)'
              : clip(longest.text, 16) || '∅',
          longestBytes: longest.bytes.length,
          fragRate: fragByCode.get(r.code) ?? null,
        };
      });
  });

  const sorted = $derived.by((): Row[] => {
    const dir = sortAsc ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === 'name') return dir * a.name.localeCompare(b.name);
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return dir * ((av as number) - (bv as number));
    });
  });

  const minTokens = $derived(Math.min(...rows.map((r) => r.tokens), Infinity));
  const maxTokens = $derived(Math.max(...rows.map((r) => r.tokens), 0));

  function sortBy(key: SortKey): void {
    if (sortKey === key) sortAsc = !sortAsc;
    else {
      sortKey = key;
      sortAsc = key === 'name';
    }
  }

  const COLS: { key: SortKey; label: string; hint: string }[] = [
    { key: 'name', label: 'Tokenizer', hint: '' },
    { key: 'tokens', label: 'Tokens', hint: 'fewer is more efficient' },
    { key: 'charsPerTok', label: 'Chars / tok', hint: 'higher is more efficient' },
    { key: 'bytesPerTok', label: 'Bytes / tok', hint: 'higher is more efficient' },
    { key: 'fragRate', label: 'Word frag.', hint: 'common English words split' },
  ];
</script>

<section class="ct">
  <span class="eyebrow">Comparison</span>
  {#if rows.length === 0}
    <div class="ct-empty">Nothing to compare yet.</div>
  {:else}
    <div class="scroll-x">
      <table class="mono">
        <thead>
          <tr>
            {#each COLS as col (col.key)}
              <th>
                <button
                  class="sortbtn"
                  onclick={() => sortBy(col.key)}
                  title={col.hint}
                >
                  {col.label}
                  <span class="arrow"
                    >{sortKey === col.key ? (sortAsc ? '▲' : '▼') : ''}</span
                  >
                </button>
              </th>
            {/each}
            <th class="th-plain">Longest token</th>
          </tr>
        </thead>
        <tbody>
          {#each sorted as row (row.code)}
            <tr>
              <td>
                <span class="key" style:background={tokenizerHue(row.code)}></span>
                {row.name}
              </td>
              <td
                class="num"
                class:best={row.tokens === minTokens}
                class:worst={row.tokens === maxTokens && minTokens !== maxTokens}
              >
                {row.tokens.toLocaleString()}
              </td>
              <td class="num">{row.charsPerTok.toFixed(2)}</td>
              <td class="num">{row.bytesPerTok.toFixed(2)}</td>
              <td class="num">
                {#if row.fragRate === null}
                  <span class="na">n/a</span>
                {:else}
                  {(row.fragRate * 100).toFixed(0)}%
                {/if}
              </td>
              <td class="longest">
                <span class="lt">{row.longestText}</span>
                <span class="lb">{row.longestBytes} B</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="ct-note">
      Highlighted: fewest tokens for this input (most efficient) and most.
      {#if !app.fragmentation.applicable}
        Word fragmentation is n/a — {app.fragmentation.reason.toLowerCase()}
      {/if}
    </p>
  {/if}
</section>

<style>
  .ct {
    margin-top: 22px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
    margin-top: 9px;
  }
  th,
  td {
    text-align: left;
    padding: 7px 12px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  thead th {
    border-bottom: 1px solid var(--border-strong);
  }
  .sortbtn,
  .th-plain {
    background: none;
    border: none;
    padding: 0;
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-faint-solid);
    font-weight: 500;
  }
  .sortbtn:hover {
    color: var(--text);
  }
  .arrow {
    color: var(--accent);
  }
  td.num {
    text-align: right;
  }
  .key {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 2px;
    margin-right: 7px;
    vertical-align: baseline;
  }
  .best {
    color: var(--good);
    font-weight: 600;
  }
  .worst {
    color: var(--warn);
  }
  .na {
    color: var(--text-faint-solid);
  }
  .longest {
    white-space: nowrap;
  }
  .lt {
    color: var(--text);
  }
  .lb {
    color: var(--text-faint-solid);
    font-size: 11px;
    margin-left: 8px;
  }
  .ct-note {
    margin: 9px 2px 0;
    font-size: 11.5px;
    color: var(--text-faint-solid);
  }
  .ct-empty {
    color: var(--text-dim);
    font-size: 13px;
    padding: 14px 0;
  }
</style>
