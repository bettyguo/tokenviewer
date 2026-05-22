/** Byte/char offset helpers shared by the analysis modules. */

const encoder = new TextEncoder();

/**
 * Byte offset of the start of each Unicode code point.
 * Returns an array of length `codePointCount + 1`; the final entry is the
 * total UTF-8 byte length. Strictly increasing.
 */
export function codePointByteBoundaries(text: string): number[] {
  const boundaries: number[] = [0];
  let bytes = 0;
  for (const ch of text) {
    bytes += encoder.encode(ch).length;
    boundaries.push(bytes);
  }
  return boundaries;
}

/**
 * Index of the code point that contains `byteOffset`, given the boundary array
 * from `codePointByteBoundaries`. If `byteOffset` sits exactly on a boundary it
 * is treated as the start of that code point.
 */
export function codePointAtByte(boundaries: number[], byteOffset: number): number {
  // Binary search for the greatest index whose boundary is <= byteOffset.
  let lo = 0;
  let hi = boundaries.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (boundaries[mid] <= byteOffset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Byte offset at each UTF-16 code-unit index. Length `text.length + 1`.
 * Correct at code-point boundaries (mid-surrogate entries repeat the
 * pre-pair offset), which is all the analysis code needs.
 */
export function utf16ByteOffsets(text: string): number[] {
  const offsets = new Array<number>(text.length + 1);
  offsets[0] = 0;
  let bytes = 0;
  let i = 0;
  while (i < text.length) {
    const cp = text.codePointAt(i)!;
    const units = cp > 0xffff ? 2 : 1;
    const charBytes = encoder.encode(String.fromCodePoint(cp)).length;
    if (units === 2) offsets[i + 1] = bytes;
    bytes += charBytes;
    offsets[i + units] = bytes;
    i += units;
  }
  return offsets;
}

/** Format a byte count as a short human string. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
