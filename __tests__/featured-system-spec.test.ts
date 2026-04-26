import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { isFeaturedActive, sortFeaturedReps } from '@/lib/featured';
import type { Representative } from '@/lib/types';

const root = path.resolve(__dirname, '..');

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf-8');
}

describe('featured listing system spec', () => {
  it('keeps legacy/grandfathered users featured without an expiry date', () => {
    expect(isFeaturedActive({
      email: 'legacy@example.com',
      activatedAt: '2026-01-01T00:00:00.000Z',
      emailSentToRep: false,
      emailSentToOwner: false,
      isLegacyFeatured: true,
      status: 'legacy',
      featuredExpiryDate: null,
    })).toBe(true);
  });

  it('removes expired paid users from featured display', () => {
    expect(isFeaturedActive({
      email: 'expired@example.com',
      activatedAt: '2026-01-01T00:00:00.000Z',
      emailSentToRep: false,
      emailSentToOwner: false,
      isFeatured: false,
      status: 'expired',
      expiresAt: '2020-01-01T00:00:00.000Z',
    })).toBe(false);
  });

  it('keeps cancelled paid users visible only until expiry', () => {
    expect(isFeaturedActive({
      email: 'cancelled@example.com',
      activatedAt: '2026-01-01T00:00:00.000Z',
      emailSentToRep: false,
      emailSentToOwner: false,
      status: 'cancelled',
      expiresAt: '2099-01-01T00:00:00.000Z',
    })).toBe(true);
  });

  it('sorts featured reps deterministically, preserving Robert first then paid activation recency', () => {
    const reps = [
      { id: 'a', slug: 'alice', name: 'Alice', email: 'a@example.com', county: '', stations: [], phone: '', availability: '', accreditation: '', notes: '', featured: true },
      { id: 'r', slug: 'robert-cashman', name: 'Robert Cashman', email: 'robertdavidcashman@gmail.com', county: '', stations: [], phone: '', availability: '', accreditation: '', notes: '', featured: true },
      { id: 'b', slug: 'bob', name: 'Bob', email: 'b@example.com', county: '', stations: [], phone: '', availability: '', accreditation: '', notes: '', featured: true },
    ] satisfies Representative[];
    const flags = new Map([
      ['a@example.com', { email: 'a@example.com', activatedAt: '2026-01-01T00:00:00.000Z', emailSentToRep: false, emailSentToOwner: false, status: 'active' as const }],
      ['b@example.com', { email: 'b@example.com', activatedAt: '2026-02-01T00:00:00.000Z', emailSentToRep: false, emailSentToOwner: false, status: 'active' as const }],
    ]);
    expect(sortFeaturedReps(reps, flags).map((r) => r.slug)).toEqual(['robert-cashman', 'bob', 'alice']);
  });

  it('has no manual featured toggle in the account dashboard', () => {
    const src = read('app/Account/AccountDashboard.tsx');
    expect(src).not.toMatch(/manual.*featured/i);
    expect(src).not.toMatch(/setFeatured\(/);
  });

  it('places the featured listing advert on homepage, dashboard, and directory', () => {
    expect(read('app/page.tsx')).toContain('FeaturedListingAdvert');
    expect(read('app/Account/AccountDashboard.tsx')).toContain('FeaturedListingAdvert');
    expect(read('app/directory/page.tsx')).toContain('FeaturedListingAdvert');
  });

  it('exposes the requested Lemon Squeezy webhook URL alias', () => {
    expect(read('app/api/lemon-squeezy/webhook/route.ts')).toContain('@/app/api/webhooks/lemonsqueezy/route');
  });

  it('provides admin/debug visibility without a manual featured toggle', () => {
    const src = read('app/api/admin/featured/route.ts');
    expect(src).toContain('listFeaturedDebug');
    expect(src).toContain('grandfatherExistingFeaturedReps');
    expect(src).not.toMatch(/toggle/i);
  });
});
