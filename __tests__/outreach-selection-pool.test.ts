import { describe, expect, it } from 'vitest';
import { outreachSelectionPoolLimits } from '@/lib/firm-outreach/outreach/selection-pool';

describe('outreachSelectionPoolLimits', () => {
  it('does not clamp sentLimit to 40 under unlimited remaining (PR #22 regress)', () => {
    const unlimited = outreachSelectionPoolLimits(Number.MAX_SAFE_INTEGER);
    expect(unlimited.readyLimit).toBe(200);
    expect(unlimited.sentLimit).toBe(200);
  });

  it('keeps a finite remaining pool bounded but scans enough follow-ups', () => {
    const mid = outreachSelectionPoolLimits(25);
    expect(mid.readyLimit).toBe(25);
    expect(mid.sentLimit).toBeGreaterThanOrEqual(40);
    expect(mid.sentLimit).toBeLessThanOrEqual(200);
  });

  it('treats non-finite remaining as unlimited', () => {
    expect(outreachSelectionPoolLimits(Number.POSITIVE_INFINITY).sentLimit).toBe(200);
  });
});
