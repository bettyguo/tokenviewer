/**
 * Structural integrity check for the gallery samples bundled with the app.
 * A missing `why` or empty `text` ships silently otherwise.
 */
import { describe, expect, it } from 'vitest';
import samples from '../data/gallery_samples.json';

interface GallerySample {
  id: string;
  title: string;
  why: string;
  category: string;
  text: string;
}

describe('gallery_samples.json', () => {
  it('has at least the six categories the design promises', () => {
    const cats = new Set((samples.samples as GallerySample[]).map((s) => s.category));
    expect(cats.size).toBeGreaterThanOrEqual(6);
  });

  it('every sample has the required, non-empty fields', () => {
    for (const s of samples.samples as GallerySample[]) {
      expect(s.id, `sample.id missing`).toMatch(/^[a-z0-9-]+$/);
      expect(s.title?.length, `sample ${s.id} has no title`).toBeGreaterThan(0);
      expect(s.why?.length, `sample ${s.id} has no why`).toBeGreaterThan(0);
      expect(s.category?.length, `sample ${s.id} has no category`).toBeGreaterThan(0);
      expect(s.text?.length, `sample ${s.id} has empty text`).toBeGreaterThan(0);
    }
  });

  it('every sample id is unique', () => {
    const ids = (samples.samples as GallerySample[]).map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sample texts stay under 1 KB (the docs say roughly 100-300 chars)', () => {
    for (const s of samples.samples as GallerySample[]) {
      expect(s.text.length, `sample ${s.id} text too long`).toBeLessThan(1024);
    }
  });
});
