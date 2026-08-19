import { describe, expect, it } from 'vitest';
import { siblingFallbackPromos } from '@/lib/automation/repairs/sibling-fallback';

describe('siblingFallbackPromos', () => {
  it('provides custodynote marketing URLs for REPUK fallback', () => {
    const promos = siblingFallbackPromos('custodynote');
    // Beta commercial line: home, download, pricing, cloud-backup (no /trial or /buy).
    expect(promos.length).toBeGreaterThanOrEqual(4);
    expect(promos.some((p) => p.path === '/download')).toBe(true);
    expect(promos.some((p) => p.path === '/')).toBe(true);
    expect(promos.some((p) => p.path === '/trial')).toBe(false);
    expect(promos.some((p) => p.path === '/buy')).toBe(false);
    expect(promos.every((p) => !/free trial/i.test(p.excerpt))).toBe(true);
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
