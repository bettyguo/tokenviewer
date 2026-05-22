/**
 * Prepares tokenizer data into `public/tokenizers/`:
 *
 *  - OpenAI encodings: the js-tiktoken rank tables, written as `<code>.json`.
 *  - HF tokenizers: `tokenizer.json` + `tokenizer_config.json` downloaded from
 *    the Hugging Face Hub into `<code>/`.
 *
 * Run with `npm run fetch:tokenizers` (or `npm run setup`). The files are
 * served same-origin at runtime, so the app makes no third-party request.
 *
 * Keep the lists below in sync with src/tokenizers/registry.ts.
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'tokenizers');

/** OpenAI encodings: code -> js-tiktoken rank module name. */
const TIKTOKEN = {
  gpt2: 'gpt2',
  cl100k: 'cl100k_base',
  o200k: 'o200k_base',
};

/** HF tokenizers: code -> Hub repo id (public mirrors where the original is gated). */
const HF = {
  llama3: 'Xenova/llama-3-tokenizer',
  deepseek: 'deepseek-ai/DeepSeek-V3',
  qwen3: 'Qwen/Qwen3-8B',
  mt5: 'Xenova/mt5-small',
};

const HF_FILES = ['tokenizer.json', 'tokenizer_config.json'];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function extractTiktoken() {
  for (const [code, mod] of Object.entries(TIKTOKEN)) {
    const dest = join(OUT, `${code}.json`);
    if (await exists(dest)) {
      console.log(`  skip   ${code}.json (exists)`);
      continue;
    }
    const ranks = (await import(`js-tiktoken/ranks/${mod}`)).default;
    await writeFile(dest, JSON.stringify(ranks));
    console.log(`  write  ${code}.json`);
  }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function fetchHf() {
  for (const [code, repo] of Object.entries(HF)) {
    const dir = join(OUT, code);
    await mkdir(dir, { recursive: true });
    for (const file of HF_FILES) {
      const dest = join(dir, file);
      if (await exists(dest)) {
        console.log(`  skip   ${code}/${file} (exists)`);
        continue;
      }
      const url = `https://huggingface.co/${repo}/resolve/main/${file}`;
      try {
        const size = await download(url, dest);
        console.log(`  write  ${code}/${file} (${(size / 1024).toFixed(0)} KB)`);
      } catch (err) {
        console.error(`  ERROR  ${code}/${file}: ${err.message}`);
        process.exitCode = 1;
      }
    }
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('Preparing tokenizer data in public/tokenizers/ ...');
  await extractTiktoken();
  await fetchHf();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
