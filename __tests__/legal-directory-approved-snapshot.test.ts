import { describe, it, expect, beforeEach } from 'vitest';
import {
  createListing,
  listApprovedListings,
  listAllListings,
  saveListing,
  getListingById,
  invalidateApprovedListingsSnapshot,
  rebuildApprovedListingsSnapshot,
} from '@/lib/legal-directory/storage';
import { getDirectoryStore } from '@/lib/legal-directory/store';

const VALID_DESC =
  'We are an established criminal defence firm covering Kent police stations and magistrates courts with over twenty years of experience.';

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    businessName: 'Snapshot Test Solicitors',
    providerType: 'Criminal defence solicitor',
    categorySlug: 'solicitors',
    contactPerson: 'Jane Smith',
    email: `snap-${Math.random().toString(36).slice(2, 10)}@example.com`,
    phone: '01622 123456',
    town: 'Maidstone',
    county: 'Kent',
    description: VALID_DESC,
    consentAuthority: true,
    consentGdpr: true,
    ...overrides,
  };
}

describe('Legal Directory — approved snapshot', () => {
  beforeEach(async () => {
    await invalidateApprovedListingsSnapshot();
  });

  it('stores an approved snapshot and serves listApprovedListings from it', async () => {
    const res = await createListing(baseInput());
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const store = getDirectoryStore();
    expect(store).not.toBeNull();
    const snap = await store!.get<unknown[]>('legaldir:approved:snapshot');
    expect(Array.isArray(snap)).toBe(true);
    expect(snap!.some((l) => (l as { id: string }).id === res.id)).toBe(true);

    const approved = await listApprovedListings();
    expect(approved.find((l) => l.id === res.id)).toBeDefined();
  });

  it('excludes soft-deleted listings from the snapshot', async () => {
    const res = await createListing(baseInput());
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const listing = (await getListingById(res.id))!;
    listing.status = 'deleted';
    await saveListing(listing);

    const approved = await listApprovedListings();
    expect(approved.find((l) => l.id === res.id)).toBeUndefined();
  });

  it('rebuilds snapshot when missing (lazy backfill)', async () => {
    const res = await createListing(baseInput());
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    await invalidateApprovedListingsSnapshot();
    const rebuilt = await rebuildApprovedListingsSnapshot();
    expect(rebuilt.find((l) => l.id === res.id)).toBeDefined();

    const viaList = await listApprovedListings();
    expect(viaList.find((l) => l.id === res.id)).toBeDefined();
  });

  it('listAllListings still returns non-approved rows for admin', async () => {
    const res = await createListing(baseInput());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const listing = (await getListingById(res.id))!;
    listing.status = 'flagged_for_review';
    await saveListing(listing);

    const all = await listAllListings();
    expect(all.find((l) => l.id === res.id)?.status).toBe('flagged_for_review');
    expect((await listApprovedListings()).find((l) => l.id === res.id)).toBeUndefined();
  });
});
