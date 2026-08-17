import { describe, expect, it } from 'vitest';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import { canManualSendProspect } from '@/lib/firm-outreach/outreach/admin-actions';
import { sendOutreachEmail } from '@/lib/firm-outreach/outreach/send';
import {
  AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED,
  FIRM_OUTREACH_CAMPAIGN_ID,
  isAgentCoverOutreachDisabled,
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

describe('PSA agent-cover permanently disabled', () => {
  it('keeps the permanent disable flag and RepUK-only sendable list', () => {
    expect(AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED).toBe(true);
    expect(isAgentCoverOutreachDisabled()).toBe(true);
    expect(isOutreachCampaignSendable(AGENT_COVER_KENT_CAMPAIGN_ID)).toBe(false);
    expect(isOutreachCampaignSendable(FIRM_OUTREACH_CAMPAIGN_ID)).toBe(true);
    expect([...SENDABLE_OUTREACH_CAMPAIGN_IDS]).toEqual([FIRM_OUTREACH_CAMPAIGN_ID]);
  });

  it('blocks provider send for agent_cover prospects', async () => {
    const result = await sendOutreachEmail({
      prospect: sampleProspect(AGENT_COVER_KENT_CAMPAIGN_ID),
      step: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('agent_cover_outreach_permanently_disabled');
    expect(result.subject).toContain('Police Station Agent');
  });

  it('blocks admin manual send for agent_cover prospects', () => {
    const eligibility = canManualSendProspect(
      sampleProspect(AGENT_COVER_KENT_CAMPAIGN_ID),
      false,
      false,
    );
    expect(eligibility.ok).toBe(false);
    expect(eligibility.reason).toBe('agent_cover_outreach_permanently_disabled');
  });

  it('still allows admin eligibility checks for RepUK WhatsApp prospects', () => {
    const eligibility = canManualSendProspect(
      sampleProspect(FIRM_OUTREACH_CAMPAIGN_ID),
      false,
      false,
    );
    expect(eligibility.ok).toBe(true);
  });
});
