#!/usr/bin/env -S npx tsx
/**
 * tokenviewer CLI — compare LLM tokenizers from the command line.
 *
 * Uses the same verified adapters as the web app. Tokenizer data must already
 * be in `public/tokenizers/` (run `npm run setup` once).
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { TokenizerEngine } from '../src/tokenizers/engine';
import {
  DEFAULT_CODES,
  TOKENIZERS,
  TOKENIZER_BY_CODE,
} from '../src/tokenizers/registry';
import { loadAssetsFromFs } from '../scripts/node_assets';

type Format = 'counts' | 'table' | 'json';

interface CliOptions {
  text?: string;
  file?: string;
  tokenizers: string[];
  format: Format;
  detail: boolean;
  list: boolean;
  help: boolean;
}

const HELP = `tokenviewer — compare LLM tokenizers from the command line

USAGE
  tokenviewer [options] [text]
  echo "text" | tokenviewer [options]
  tokenviewer -f input.txt [options]
  tokenviewer --list

OPTIONS
  -t, --tokenizers <codes>   Comma-separated tokenizer codes (default: all)
  -f, --file <path>          Read text from a file ("-" for stdin)
  --format <fmt>             counts | table | json (default: counts)
  --detail                   Include per-token data in json output
  --list                     List available tokenizers and exit
  -h, --help                 Show this help

EXAMPLES
  echo "你好世界" | tokenviewer
  tokenviewer "Hello, world" -t gpt2,o200k --format table
  tokenviewer -f README.md --format json --detail | jq '.[] | {code, tokens}'
`;

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    tokenizers: [...DEFAULT_CODES],
    format: 'counts',
    detail: false,
    list: false,
    help: false,
  };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? die(`missing value for ${a}`);
    switch (a) {
      case '-h':
      case '--help':
        opts.help = true;
        break;
      case '--list':
        opts.list = true;
        break;
      case '-t':
      case '--tokenizers':
        opts.tokenizers = next()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case '-f':
      case '--file':
        opts.file = next();
        break;
      case '--format':
        opts.format = next() as Format;
        if (!['counts', 'table', 'json'].includes(opts.format))
          die(`unknown format: ${opts.format}`);
        break;
      case '--detail':
        opts.detail = true;
        break;
      default:
        if (a.startsWith('-')) die(`unknown option: ${a}`);
        positional.push(a);
    }
  }
  if (positional.length > 0) opts.text = positional.join(' ');
  return opts;
}

function die(msg: string): never {
  process.stderr.write(`tokenviewer: ${msg}\nRun with --help for usage.\n`);
  process.exit(2);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function resolveText(opts: CliOptions): Promise<string> {
  if (opts.file === '-') return readStdin();
  if (opts.file) return readFile(resolve(opts.file), 'utf8');
  if (opts.text !== undefined) return opts.text;
  if (!process.stdin.isTTY) return readStdin();
  die('no input — provide text as an argument, -f <file>, or stdin');
}

function printList(): void {
  for (const t of TOKENIZERS) {
    process.stdout.write(
      `${t.code.padEnd(10)} ${t.family.padEnd(9)} ${t.algorithm.padEnd(22)} ${String(t.vocabSize).padStart(7)}\n`,
    );
  }
}

function loadEngine(codes: string[]): Promise<TokenizerEngine> {
  const eng = new TokenizerEngine();
  const tasks = codes.map(async (c) => {
    if (!TOKENIZER_BY_CODE.has(c)) die(`unknown tokenizer: ${c}`);
    try {
      eng.load(c, await loadAssetsFromFs(c));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      die(
        `failed to load "${c}" (${msg}). ` +
          `Tokenizer data missing? Run \`npm run setup\` first.`,
      );
    }
  });
  return Promise.all(tasks).then(() => eng);
}

interface RowOut {
  code: string;
  name: string;
  tokens: number;
  charsPerToken: number;
  bytesPerToken: number;
}

function summarise(engine: TokenizerEngine, codes: string[], text: string): RowOut[] {
  const out: RowOut[] = [];
  for (const code of codes) {
    const r = engine.run(text, code);
    if (r.error || r.tokens.length === 0) continue;
    out.push({
      code,
      name: TOKENIZER_BY_CODE.get(code)?.name ?? code,
      tokens: r.tokens.length,
      charsPerToken: +(r.charLength / r.tokens.length).toFixed(3),
      bytesPerToken: +(r.byteLength / r.tokens.length).toFixed(3),
    });
  }
  return out;
}

function emitCounts(rows: RowOut[]): void {
  for (const r of rows) {
    process.stdout.write(
      `${r.code}\t${r.tokens}\t${r.charsPerToken.toFixed(2)}\t${r.bytesPerToken.toFixed(2)}\n`,
    );
  }
}

function emitTable(rows: RowOut[]): void {
  const nameW = Math.max(9, ...rows.map((r) => r.name.length));
  const head =
    `${'TOKENIZER'.padEnd(nameW)}  ${'TOKENS'.padStart(7)}` +
    `  ${'CHARS/TOK'.padStart(9)}  ${'BYTES/TOK'.padStart(9)}\n`;
  process.stdout.write(head);
  process.stdout.write('-'.repeat(head.length - 1) + '\n');
  for (const r of rows) {
    process.stdout.write(
      `${r.name.padEnd(nameW)}  ${String(r.tokens).padStart(7)}` +
        `  ${r.charsPerToken.toFixed(2).padStart(9)}` +
        `  ${r.bytesPerToken.toFixed(2).padStart(9)}\n`,
    );
  }
}

function emitJson(
  engine: TokenizerEngine,
  codes: string[],
  text: string,
  detail: boolean,
): void {
  const out = codes
    .map((code) => {
      const r = engine.run(text, code);
      if (r.error) return { code, error: r.error };
      const spec = TOKENIZER_BY_CODE.get(code);
      const base = {
        code,
        name: spec?.name ?? code,
        algorithm: spec?.algorithm,
        vocab: r.vocabSize,
        tokenCount: r.tokens.length,
        charLength: r.charLength,
        byteLength: r.byteLength,
        charsPerToken: +(r.charLength / r.tokens.length).toFixed(3),
        bytesPerToken: +(r.byteLength / r.tokens.length).toFixed(3),
      };
      if (!detail) return base;
      return {
        ...base,
        tokens: r.tokens.map((t) => ({
          id: t.id,
          kind: t.kind,
          text: t.text,
          startByte: t.startByte,
          endByte: t.endByte,
        })),
      };
    })
    .filter((r) => !('error' in r));
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    return;
  }
  if (opts.list) {
    printList();
    return;
  }
  const text = await resolveText(opts);
  const engine = await loadEngine(opts.tokenizers);
  if (opts.format === 'json') {
    emitJson(engine, opts.tokenizers, text, opts.detail);
    return;
  }
  const rows = summarise(engine, opts.tokenizers, text);
  if (opts.format === 'table') emitTable(rows);
  else emitCounts(rows);
}

main().catch((err) => {
  process.stderr.write(
    `tokenviewer: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
