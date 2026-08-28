import { describe, expect, it, vi } from 'vitest';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import { outreachSendEnabled } from '@/lib/firm-outreach/constants';
import { canManualSendProspect } from '@/lib/firm-outreach/outreach/admin-actions';
import { sendOutreachEmail } from '@/lib/firm-outreach/outreach/send';
import {
  AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED,
  FIRM_OUTREACH_CAMPAIGN_ID,
  FIRM_OUTREACH_EMAIL_DISABLED_REASON,
  FIRM_OUTREACH_EMAIL_PERMANENTLY_DISABLED,
  isFirmOutreachEmailPermanentlyDisabled,
  isFirmOutreachOperatorMailDisabled,
  isOutreachCampaignSendable,
  SENDABLE_OUTREACH_CAMPAIGN_IDS,
} from '@/lib/firm-outreach/site-config';
import type { FirmProspect } from '@/lib/firm-outreach/types';

function sampleProspect(campaignId: string): FirmProspect {
  return {
    id: `${campaignId}:test-firm`,
    campaignId,
    firmName: 'Test Criminal Defence Ltd',
    firmKey: 'test-criminal-defence-ltd',
    prospectType: 'firm',
    email: 'crime@example-firm.co.uk',
    status: 'ready_to_send',
    sources: ['manual'],
    sequenceStep: 0,
    priorityScore: 50,
    enrichAttempts: 0,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

describe('Firm outreach email permanently disabled (RepUK + PSA)', () => {
  it('locks permanent disable flags and empty sendable list', () => {
    expect(FIRM_OUTREACH_EMAIL_PERMANENTLY_DISABLED).toBe(true);
    expect(AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED).toBe(true);
    expect(isFirmOutreachEmailPermanentlyDisabled()).toBe(true);
    expect(isFirmOutreachOperatorMailDisabled()).toBe(true);
    expect(outreachSendEnabled()).toBe(false);
    expect([...SENDABLE_OUTREACH_CAMPAIGN_IDS]).toEqual([]);
    expect(isOutreachCampaignSendable(FIRM_OUTREACH_CAMPAIGN_ID)).toBe(false);
    expect(isOutreachCampaignSendable(AGENT_COVER_KENT_CAMPAIGN_ID)).toBe(false);
  });

  it('blocks provider send for RepUK and PSA prospects', async () => {
    for (const campaignId of [FIRM_OUTREACH_CAMPAIGN_ID, AGENT_COVER_KENT_CAMPAIGN_ID]) {
      const result = await sendOutreachEmail({
        prospect: sampleProspect(campaignId),
        step: 1,
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    }
  });

  it('blocks admin manual send for both campaigns', () => {
    for (const campaignId of [FIRM_OUTREACH_CAMPAIGN_ID, AGENT_COVER_KENT_CAMPAIGN_ID]) {
      const eligibility = canManualSendProspect(sampleProspect(campaignId), false, false);
      expect(eligibility.ok).toBe(false);
      expect(eligibility.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    }
  });

  it('worker tick accepts 0 and skips with permanent reason', async () => {
    vi.resetModules();
    const { runOutreachWorkerTick } = await import('@/lib/firm-outreach/outreach/run-worker');
    const result = await runOutreachWorkerTick({ limit: 10 });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(result.accepted).toBe(0);
    expect(result.claimed).toBe(0);
    expect(result.jobsCreated).toBe(0);
  });
});
