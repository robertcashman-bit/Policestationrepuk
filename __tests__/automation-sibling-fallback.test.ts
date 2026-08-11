import { describe, expect, it } from 'vitest';
import { siblingFallbackPromos } from '@/lib/automation/repairs/sibling-fallback';

describe('siblingFallbackPromos', () => {
  it('provides custodynote marketing URLs for REPUK fallback', () => {
    const promos = siblingFallbackPromos('custodynote');
    expect(promos.length).toBeGreaterThanOrEqual(5);
    expect(promos.some((p) => p.path === '/download')).toBe(true);
    expect(promos.some((p) => p.path === '/')).toBe(true);
  });

  it('provides psrtrain marketing URLs when sibling scheduler returns 0', () => {
    const promos = siblingFallbackPromos('psrtrain');
    expect(promos.length).toBeGreaterThanOrEqual(4);
    expect(promos.some((p) => p.path === '/guides')).toBe(true);
  });

  it('has no catalog for PSA (self-scheduler with working feed)', () => {
    expect(siblingFallbackPromos('policestationagent')).toEqual([]);
  });
});
