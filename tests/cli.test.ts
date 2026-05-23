/**
 * End-to-end CLI tests. Each spawns `npx tsx bin/tokenviewer.ts ...` and
 * asserts the documented contract (exit code, output format, error paths).
 * Slower than the unit tests — every spawn pays the tsx + engine warm-up —
 * but only this layer catches the things a CLI user actually hits: argv
 * parsing, stdin, file reading, --list, --format json shape, exit codes.
 */
import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { TOKENIZERS } from '../src/tokenizers/registry';

const CLI = ['tsx', 'bin/tokenviewer.ts'];
const TIMEOUT = 60_000;

interface RunResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

function run(args: string[], stdin?: string): Promise<RunResult> {
  return new Promise((resolveRun, rejectRun) => {
    const proc = spawn('npx', [...CLI, ...args], { shell: true });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (b) => (stdout += b.toString('utf8')));
    proc.stderr.on('data', (b) => (stderr += b.toString('utf8')));
    proc.on('error', rejectRun);
    proc.on('close', (code) => resolveRun({ stdout, stderr, code }));
    if (stdin !== undefined) {
      proc.stdin.write(stdin);
      proc.stdin.end();
    } else {
      proc.stdin.end();
    }
  });
}

describe('CLI', () => {
  it(
    '--list enumerates every tokenizer code and exits 0',
    async () => {
      const { stdout, code } = await run(['--list']);
      expect(code).toBe(0);
      for (const t of TOKENIZERS) {
        expect(stdout, `--list missing ${t.code}`).toContain(t.code);
      }
    },
    TIMEOUT,
  );

  it(
    'reads stdin and emits TSV counts',
    async () => {
      const { stdout, stderr, code } = await run(['-t', 'gpt2,o200k'], 'hello world');
      expect(stderr).toBe('');
      expect(code).toBe(0);
      const lines = stdout.trim().split('\n');
      expect(lines).toHaveLength(2);
      // Each row: code<TAB>tokens<TAB>chars/tok<TAB>bytes/tok
      for (const line of lines) {
        const parts = line.split('\t');
        expect(parts).toHaveLength(4);
        expect(Number.parseInt(parts[1], 10)).toBeGreaterThan(0);
      }
      // GPT-2's count for "hello world" is well-known (2 tokens).
      const gpt2 = lines.find((l) => l.startsWith('gpt2\t'));
      expect(gpt2).toBeDefined();
      expect(gpt2!.split('\t')[1]).toBe('2');
    },
    TIMEOUT,
  );

  it(
    '--format json emits a stable shape',
    async () => {
      const { stdout, code } = await run(
        ['-t', 'gpt2', '--format', 'json'],
        'hello world',
      );
      expect(code).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        code: 'gpt2',
        name: 'GPT-2',
        tokenCount: 2,
      });
      expect(parsed[0].charsPerToken).toBeGreaterThan(0);
      expect(parsed[0].bytesPerToken).toBeGreaterThan(0);
      // Without --detail, no per-token data
      expect(parsed[0].tokens).toBeUndefined();
    },
    TIMEOUT,
  );

  it(
    '--detail adds per-token data',
    async () => {
      const { stdout, code } = await run(
        ['-t', 'gpt2', '--format', 'json', '--detail'],
        'hi',
      );
      expect(code).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed[0].tokens).toBeDefined();
      expect(parsed[0].tokens.length).toBe(parsed[0].tokenCount);
      for (const t of parsed[0].tokens) {
        expect(typeof t.id).toBe('number');
        expect(typeof t.startByte).toBe('number');
        expect(typeof t.endByte).toBe('number');
      }
    },
    TIMEOUT,
  );

  it(
    'exits 2 on an unknown tokenizer',
    async () => {
      const { stderr, code } = await run(['-t', 'totally-fake', 'hi']);
      expect(code).toBe(2);
      expect(stderr).toContain('unknown tokenizer');
    },
    TIMEOUT,
  );
});
