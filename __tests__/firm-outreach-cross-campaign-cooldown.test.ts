import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirmProspect } from '@/lib/firm-outreach/types';

const siblingsByFirm = vi.hoisted(() => new Map<string, FirmProspect[]>());
const sendsByEmail = vi.hoisted(() => new Map<string, Array<{ status: string; sentAt?: string; createdAt: string }>>());

vi.mock('@/lib/firm-outreach/storage', () => ({
  listProspectsForFirmKey: async (firmKey: string) => siblingsByFirm.get(firmKey) ?? [],
  listSendsForEmail: async (email: string) => sendsByEmail.get(email.toLowerCase()) ?? [],
}));

import {
  applyFirmCooldownPark,
  isCrossCampaignCooldownActive,
} from '@/lib/firm-outreach/cross-campaign-cooldown';

function prospect(overrides: Partial<FirmProspect>): FirmProspect {
  return {
    id: overrides.id ?? 'p1',
    firmKey: overrides.firmKey ?? 'firm',
    firmName: overrides.firmName ?? 'Firm',
    prospectType: overrides.prospectType ?? 'firm',
    status: overrides.status ?? 'ready_to_send',
    sequenceStep: 0,
    sources: ['laa'],
    priorityScore: 10,
    campaignId: overrides.campaignId ?? 'agent_cover_kent_v1',
    enrichAttempts: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    email: overrides.email ?? 'info@example.co.uk',
    ...overrides,
  };
}

describe('cross-campaign cooldown', () => {
  beforeEach(() => {
    siblingsByFirm.clear();
    sendsByEmail.clear();
  });

  it('detects recent contact on another campaign via firm sibling', async () => {
    const recent = new Date().toISOString();
    siblingsByFirm.set('acme', [
      prospect({
        id: 'repuk',
        firmKey: 'acme',
        campaignId: 'whatsapp_invite_v1',
        lastEmailAt: recent,
        status: 'sent',
      }),
    ]);
    const cool = await isCrossCampaignCooldownActive({
      firmKey: 'acme',
      email: 'info@example.co.uk',
      excludeProspectId: 'psa-1',
    });
    expect(cool.active).toBe(true);
    expect(cool.eligibleAt).toBeTruthy();
  });

  it('parks prospect with firm_cooldown + nextEligibleAt', () => {
    const p = prospect({ id: 'psa-1' });
    const eligibleAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    applyFirmCooldownPark(p, eligibleAt);
    expect(p.status).toBe('ready_to_send');
    expect(p.excludedReason).toBe('firm_cooldown');
    expect(p.nextEligibleAt).toBe(eligibleAt);
  });

  it('is inactive when only stale contact exists', async () => {
    const stale = new Date(Date.now() - 200 * 86_400_000).toISOString();
    siblingsByFirm.set('acme', [
      prospect({
        id: 'repuk',
        firmKey: 'acme',
        campaignId: 'whatsapp_invite_v1',
        lastEmailAt: stale,
        status: 'sent',
      }),
    ]);
    const cool = await isCrossCampaignCooldownActive({
      firmKey: 'acme',
      email: 'info@example.co.uk',
    });
    expect(cool.active).toBe(false);
  });
});
