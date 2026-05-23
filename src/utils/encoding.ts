/**
 * URL-state encoding. Application state (input text + enabled tokenizers +
 * theme) is stored in the location hash so a comparison is shareable by link,
 * and so the input text is never sent to a server. See
 * docs/STATIC_SITE_ROUTING.md.
 */
import { TOKENIZER_BY_CODE } from '../tokenizers/registry';

/** Largest input (UTF-8 bytes) embedded in a share link. */
export const MAX_EMBED_BYTES = 8192;

export interface ShareState {
  text: string;
  codes: string[];
  theme?: 'dark' | 'light';
}

const utf8 = new TextEncoder();
const utf8d = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  // Older Android/WebView atob implementations require padding; modern ones tolerate
  // its absence. Re-pad here so a stripped-padding share link decodes everywhere.
  const remainder = s.length % 4;
  const padded =
    s.replace(/-/g, '+').replace(/_/g, '/') +
    (remainder ? '='.repeat(4 - remainder) : '');
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pumpStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  void writer.write(bytes as BufferSource);
  void writer.close();
  return pumpStream(cs.readable);
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  void writer.write(bytes as BufferSource);
  void writer.close();
  return pumpStream(ds.readable);
}

const hasCompression = typeof globalThis.CompressionStream !== 'undefined';
const hasDecompression = typeof globalThis.DecompressionStream !== 'undefined';

/**
 * Encode input text to a URL-safe string. Prefixed with `g` (gzip) or `r`
 * (raw) so the decoder knows what it received — no dependency on a deflate
 * library, and graceful on browsers without CompressionStream.
 */
export async function encodeInput(text: string): Promise<string> {
  const bytes = utf8.encode(text);
  if (hasCompression) {
    return 'g' + toBase64Url(await gzip(bytes));
  }
  return 'r' + toBase64Url(bytes);
}

/** Decode input text produced by `encodeInput`. Throws on malformed input. */
export async function decodeInput(encoded: string): Promise<string> {
  const tag = encoded[0];
  const body = fromBase64Url(encoded.slice(1));
  if (tag === 'g') {
    if (!hasDecompression) {
      throw new Error('DecompressionStream is unavailable in this browser');
    }
    return utf8d.decode(await gunzip(body));
  }
  if (tag === 'r') return utf8d.decode(body);
  throw new Error('unknown input encoding tag');
}

/**
 * Build a location hash from app state. If the input is larger than
 * `MAX_EMBED_BYTES` it is omitted (the caller should tell the user the text
 * is too large to embed) — never silently truncated.
 */
export async function encodeStateToHash(
  state: ShareState,
): Promise<{ hash: string; inputEmbedded: boolean }> {
  const params = new URLSearchParams();
  const inputBytes = utf8.encode(state.text).length;
  let inputEmbedded = false;
  if (state.text.length > 0 && inputBytes <= MAX_EMBED_BYTES) {
    params.set('i', await encodeInput(state.text));
    inputEmbedded = true;
  }
  if (state.codes.length > 0) params.set('t', state.codes.join(','));
  if (state.theme) params.set('th', state.theme);
  return { hash: '#' + params.toString(), inputEmbedded };
}

/** Parse a location hash into partial app state. Fails closed on bad data. */
export async function decodeStateFromHash(hash: string): Promise<Partial<ShareState>> {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return {};
  const params = new URLSearchParams(raw);
  const state: Partial<ShareState> = {};
  const i = params.get('i');
  if (i) {
    try {
      state.text = await decodeInput(i);
    } catch {
      // Malformed link: leave text undefined; the caller surfaces a notice.
    }
  }
  const t = params.get('t');
  if (t) {
    state.codes = t.split(',').filter((c) => c && TOKENIZER_BY_CODE.has(c));
  }
  const th = params.get('th');
  if (th === 'dark' || th === 'light') state.theme = th;
  return state;
}
