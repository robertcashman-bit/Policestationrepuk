import { describe, expect, it } from 'vitest';
import { siblingFallbackPromos } from '@/lib/automation/repairs/sibling-fallback';

describe('siblingFallbackPromos', () => {
  it('provides custodynote marketing URLs for REPUK fallback', () => {
    const promos = siblingFallbackPromos('custodynote');
    expect(promos.length).toBeGreaterThanOrEqual(5);
    expect(promos.some((p) => p.path === '/download')).toBe(true);
    expect(promos.some((p) => p.path === '/')).toBe(true);
  });

  it('has no catalog for sites that self-schedule', () => {
    expect(siblingFallbackPromos('psrtrain')).toEqual([]);
    expect(siblingFallbackPromos('policestationagent')).toEqual([]);
  });
});
