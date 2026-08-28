/**
 * Live Aug 26–27 2026 on 5828338: digests reported "15/18 ready to send" while
 * Daily Outreach Report said eligible=0 / accepted=0 / NO_ELIGIBLE_LEADS and
 * "no action required". Capacity must count due follow-ups + truly sendable
 * ready, and the daily report must not claim all-clear on that contradiction.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSelect = vi.fn();

vi.mock('@/lib/firm-outreach/outreach/candidate-selection', () => ({
  selectOutreachCandidates: (...a: unknown[]) => mockSelect(...a),
}));

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  countEmailJobsByStatus: vi.fn(async () => ({})),
  countClaimableJobsForCampaign: vi.fn(async () => 0),
  getEmailJob: vi.fn(),
  listEmailJobIdsByStatus: vi.fn(async () => []),
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getDailySendCount: vi.fn(async () => 0),
  getGlobalResendQuotaRemaining: vi.fn(async () => 500),
  getHourlySendCount: vi.fn(async () => 0),
  getResendSendCount: vi.fn(async () => 0),
  utcHourBucket: () => '2026-08-27T12',
}));

vi.mock('@/lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: vi.fn(async () => true),
}));

import { countEligibleUnsent, getOutreachCapacity } from '@/lib/firm-outreach/capacity';
import { isSendableReadyProspect } from '@/lib/firm-outreach/sendable-ready';
import type { FirmProspect } from '@/lib/firm-outreach/types';

function readyProspect(over: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: 'fop_r',
    prospectType: 'firm',
    firmName: 'Ready Firm',
    firmKey: 'ready-firm',
    sources: ['laa'],
    status: 'ready_to_send',
    priorityScore: 10,
    sequenceStep: 0,
    campaignId: 'whatsapp_invite_v1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    enrichAttempts: 1,
    email: 'crime@readyfirm.co.uk',
    ...over,
  };
}

describe('ready>0 / eligible=0 contradiction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FIRM_OUTREACH_DRY_RUN;
    process.env.FIRM_OUTREACH_SEND_ENABLED = 'true';
  });

  it('isSendableReadyProspect rejects parked leftovers digests used to call sendable', () => {
    expect(
      isSendableReadyProspect(
        readyProspect({
          nextEligibleAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        }),
      ),
    ).toBe(false);
    expect(isSendableReadyProspect(readyProspect())).toBe(true);
  });

  it('countEligibleUnsent includes due follow-ups (not only ready_to_send)', async () => {
    mockSelect.mockResolvedValue({
      candidates: [{ prospect: readyProspect({ id: 'fop_fu', status: 'sent' }), step: 1 }],
      readyScanned: 0,
      sentScanned: 80,
      readyEligible: 0,
      followUpEligible: 12,
      skippedIndexedSend: 0,
      skippedIdempotentJob: 0,
      firmCooldownSkipped: 0,
      staleReadyToReconcile: [],
      staleFollowUpsToReconcile: [],
      readyIndexWalked: 0,
      selectionTimedOut: false,
    });

    const n = await countEligibleUnsent('whatsapp_invite_v1', 80);
    expect(n).toBe(12);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: 'whatsapp_invite_v1',
        skipIndexedSendCheck: true,
      }),
    );
  });

  it('RepUK capacity is not NO_ELIGIBLE_LEADS when follow-ups are due', async () => {
    mockSelect.mockResolvedValue({
      candidates: [],
      readyScanned: 18,
      sentScanned: 200,
      readyEligible: 0,
      followUpEligible: 25,
      skippedIndexedSend: 0,
      skippedIdempotentJob: 0,
      firmCooldownSkipped: 0,
      staleReadyToReconcile: [],
      staleFollowUpsToReconcile: [],
      readyIndexWalked: 40,
      selectionTimedOut: false,
    });

    const cap = await getOutreachCapacity('repuk', { eligibleScanLimit: 80, sampleJobs: false });
    expect(cap.eligibleUnsent).toBe(25);
    expect(cap.limitingFactor).not.toBe('no_eligible_leads');
    expect(cap.effectiveAvailableCapacity).toBeGreaterThan(0);
  });
});
