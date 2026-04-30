import { describe, it, expect } from 'vitest';
import { getRawReps, getAllReps } from '@/lib/data';

describe('getRawReps — returns unmerged static data (Bug 3)', () => {
  it('returns an array of representatives', () => {
    const reps = getRawReps();
    expect(Array.isArray(reps)).toBe(true);
    expect(reps.length).toBeGreaterThan(0);
  });

  it('is synchronous (no Supabase call)', () => {
    const start = performance.now();
    const reps = getRawReps();
    const elapsed = performance.now() - start;
    expect(reps.length).toBeGreaterThan(0);
    // Synchronous file read should complete in < 500ms
    expect(elapsed).toBeLessThan(500);
  });

  it('getAllReps returns merged directory reps (static + optional KV registrations)', async () => {
    const all = await getAllReps();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
    for (const r of all) {
      expect(r.slug).toBeTruthy();
      expect(typeof r.email).toBe('string');
    }
  });

  it('each rep has required fields', () => {
    const reps = getRawReps();
    for (const rep of reps) {
      expect(rep.slug).toBeTruthy();
      expect(rep.name).toBeTruthy();
      expect(typeof rep.email).toBe('string');
    }
  });
});
