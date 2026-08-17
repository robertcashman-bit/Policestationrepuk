import { describe, expect, it, vi } from 'vitest';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import {
  isPsaFirmOutreachBlocked,
  isPsaFirmOutreachEnabled,
  PSA_FIRM_OUTREACH_DISABLED_REASON,
  PSA_FIRM_OUTREACH_ENABLED,
} from '@/lib/firm-outreach/psa-outreach-enabled';
import { ENABLED_OUTREACH_CAMPAIGN_IDS, FIRM_OUTREACH_CAMPAIGN_ID } from '@/lib/firm-outreach/site-config';
import { canManualSendProspect } from '@/lib/firm-outreach/outreach/admin-actions';
import { sendOutreachEmail } from '@/lib/firm-outreach/outreach/send';
import { runFirmOutreach, runFirmOutreachAllCampaigns } from '@/lib/firm-outreach/outreach/run-outreach';
import type { FirmProspect } from '@/lib/firm-outreach/types';

vi.mock('@/lib/firm-outreach/email-provider', () => ({
  getEmailProvider: () => ({
    validateConfiguration: async () => ({ configured: true }),
    send: async () => {
      throw new Error('provider.send must not be called for PSA');
    },
  }),
}));

vi.mock('@/lib/firm-outreach/outreach/from-address', () => ({
  DEFAULT_PSA_FROM_FALLBACK: 'Police Station Agent <noreply@policestationrepuk.org>',
  isDomainNotVerifiedError: () => false,
  resolveFromAddressForCampaign: () => ({ from: 'x', domain: 'x', usedFallback: false }),
  resolveOutreachFromAddress: async () => ({ from: 'x', domain: 'x', usedFallback: false }),
  fetchResendVerifiedDomains: async () => new Set(['policestationrepuk.org']),
  repukFromAddress: () => 'PoliceStationRepUK <noreply@policestationrepuk.org>',
  assertOutreachSendReady: async () => ({ ok: true }),
}));

vi.mock('@/lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: async () => true,
}));

vi.mock('@/lib/firm-outreach/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-outreach/constants')>();
  return {
    ...actual,
    outreachSendEnabled: () => true,
    dailySendCap: () => 100,
  };
});

function psaProspect(): FirmProspect {
  return {
    id: 'psa_test_1',
    campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
    firmName: 'Test Firm LLP',
    prospectType: 'firm',
    email: 'crime@example-firm.test',
    status: 'ready_to_send',
    sources: ['manual'],
    sequenceStep: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('PSA firm outreach permanently disabled', () => {
  it('hard-flags PSA off and keeps RepUK enabled campaign list', () => {
    expect(PSA_FIRM_OUTREACH_ENABLED).toBe(false);
    expect(isPsaFirmOutreachEnabled()).toBe(false);
    expect(isPsaFirmOutreachBlocked(AGENT_COVER_KENT_CAMPAIGN_ID)).toBe(true);
    expect(isPsaFirmOutreachBlocked(FIRM_OUTREACH_CAMPAIGN_ID)).toBe(false);
    expect(ENABLED_OUTREACH_CAMPAIGN_IDS).toEqual([FIRM_OUTREACH_CAMPAIGN_ID]);
    expect(ENABLED_OUTREACH_CAMPAIGN_IDS).not.toContain(AGENT_COVER_KENT_CAMPAIGN_ID);
  });

  it('sendOutreachEmail refuses PSA without calling Resend', async () => {
    const result = await sendOutreachEmail({ prospect: psaProspect(), step: 1 });
    expect(result.ok).toBe(false);
    expect(result.error).toBe(PSA_FIRM_OUTREACH_DISABLED_REASON);
    expect(result.retryable).toBe(false);
  });

  it('admin manual send eligibility blocks PSA', () => {
    const gate = canManualSendProspect(psaProspect(), false, false);
    expect(gate.ok).toBe(false);
    expect(gate.reason).toBe(PSA_FIRM_OUTREACH_DISABLED_REASON);
  });

  it('runFirmOutreach skips PSA campaign immediately', async () => {
    const stats = await runFirmOutreach({
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      dryRun: false,
      limit: 5,
    });
    expect(stats.skippedReason).toBe(PSA_FIRM_OUTREACH_DISABLED_REASON);
    expect(stats.sent).toBe(0);
    expect(stats.accepted ?? 0).toBe(0);
  });

  it('runFirmOutreachAllCampaigns never schedules PSA even if requested', async () => {
    const multi = await runFirmOutreachAllCampaigns({
      campaignIds: [AGENT_COVER_KENT_CAMPAIGN_ID, FIRM_OUTREACH_CAMPAIGN_ID],
      dryRun: true,
      limit: 1,
      maxElapsedMs: 5_000,
    });
    expect(multi.byCampaign[AGENT_COVER_KENT_CAMPAIGN_ID]).toBeUndefined();
    expect(multi.byCampaign[FIRM_OUTREACH_CAMPAIGN_ID]).toBeDefined();
  });
});
