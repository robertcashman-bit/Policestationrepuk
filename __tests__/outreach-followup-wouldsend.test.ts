/**
 * Live Aug 26 2026 on 672bec6: followUpEligible=16, sendableCandidates=16,
 * wouldSendCount=0, worker accepted=0. Follow-ups with no terminal job for
 * their due step must enter wouldSend / Phase B.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firm-outreach/site-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-outreach/site-config')>();
  return {
    ...actual,
    FIRM_OUTREACH_EMAIL_PERMANENTLY_DISABLED: false,
    SENDABLE_OUTREACH_CAMPAIGN_IDS: ['whatsapp_invite_v1'] as const,
    isFirmOutreachEmailPermanentlyDisabled: () => false,
    isFirmOutreachOperatorMailDisabled: () => false,
    isAgentCoverOutreachDisabled: () => true,
    isOutreachCampaignSendable: (campaignId: string) => campaignId === 'whatsapp_invite_v1',
  };
});


const mockSaveProspect = vi.fn();
const mockEnqueue = vi.fn();
const mockClaim = vi.fn();
const mockGetProspect = vi.fn();
const mockSelect = vi.fn();
const mockSend = vi.fn();
const mockGetDailySendCount = vi.fn();
const mockGetByIdem = vi.fn();
const mockEnsureClaimable = vi.fn();
const mockIdempotentJobs = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  addSuppression: vi.fn(),
  createSendRecord: vi.fn(() => ({
    id: 'send-1',
    status: 'queued',
    prospectId: 'fop_fu',
    email: 'crime@followup.co.uk',
    campaignId: 'whatsapp_invite_v1',
    sequenceStep: 1,
    subject: '',
    createdAt: new Date().toISOString(),
  })),
  excludeProspectDuplicateEmail: vi.fn(),
  getDailySendCount: (...args: unknown[]) => mockGetDailySendCount(...args),
  getGlobalResendQuotaRemaining: vi.fn(async () => 500),
  getSuppression: vi.fn(async () => null),
  incrementDailySendCount: vi.fn(),
  incrementResendSendCount: vi.fn(),
  isDuplicateInitialSend: vi.fn(async () => false),
  hasAcceptedOutreachToday: vi.fn(async () => false),
  isSuppressed: vi.fn(async () => false),
  listSendsForEmail: vi.fn(async () => []),
  emailHasAcceptedSendOnDate: vi.fn(() => false),
  emailHasInitialOutreachFromOtherProspect: vi.fn(() => false),
  emailsWithIndexedSendsForCampaign: vi.fn(async () => new Set()),
  getProspect: (...a: unknown[]) => mockGetProspect(...a),
  getProspectsByIds: vi.fn(async () => new Map()),
  listProspectIdsByStatus: vi.fn(async () => []),
  listProspectsByRecordStatus: vi.fn(async () => []),
  listProspectsForFirmKey: vi.fn(async () => []),
  releaseDailySendSlot: vi.fn(),
  releaseHourlySendSlot: vi.fn(),
  reserveDailySendSlot: vi.fn(async () => ({ ok: true })),
  reserveHourlySendSlot: vi.fn(async () => ({ ok: true })),
  saveOutreachRunLog: vi.fn(),
  saveProspect: (...a: unknown[]) => mockSaveProspect(...a),
  saveSend: vi.fn(),
  utcHourBucket: () => '2026-08-26T07',
  refreshProspectStatusSnapshotCache: vi.fn(),
}));

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  claimNextEmailJob: (...a: unknown[]) => mockClaim(...a),
  claimEmailJobById: vi.fn(async () => null),
  enqueueEmailJob: (...a: unknown[]) => mockEnqueue(...a),
  emailsWithIdempotentJobsForCampaign: (...a: unknown[]) => mockIdempotentJobs(...a),
  ensureEmailJobClaimable: (...a: unknown[]) => mockEnsureClaimable(...a),
  getEmailJobByIdempotencyKey: (...a: unknown[]) => mockGetByIdem(...a),
  markJobAccepted: vi.fn(async (job: { status: string }) => {
    job.status = 'accepted';
    return job;
  }),
  markJobProcessing: vi.fn(async (job: { status: string }) => {
    job.status = 'processing';
    return job;
  }),
  markJobRetryOrPermanent: vi.fn(),
  markJobSuppressed: vi.fn(),
  recoverAbandonedEmailJobs: vi.fn(async () => 0),
  requeueClaimedJob: vi.fn(),
}));

vi.mock('@/lib/firm-outreach/outreach/candidate-selection', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/lib/firm-outreach/outreach/candidate-selection')
  >();
  return {
    ...actual,
    selectOutreachCandidates: (...a: unknown[]) => mockSelect(...a),
    firmRecentlyContacted: vi.fn(async () => false),
  };
});

vi.mock('@/lib/firm-outreach/outreach/send', () => ({
  sendOutreachEmail: (...args: unknown[]) => mockSend(...args),
}));

vi.mock('@/lib/firm-outreach/run-lock', () => ({
  claimProspectSend: vi.fn(async () => true),
  releaseProspectSend: vi.fn(async () => undefined),
}));

vi.mock('@/lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: vi.fn(async () => true),
}));

vi.mock('@/lib/firm-outreach/outreach/from-address', () => ({
  assertOutreachSendReady: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@/lib/firm-outreach/qualification', () => ({
  qualifyProspectForOutreach: () => ({ qualified: true }),
  resolveStatusWithQualification: (_p: unknown, status: string) => status,
}));

vi.mock('@/lib/firm-outreach/enrichment/validator', () => ({
  isPlausibleOutreachEmail: () => true,
  validateEmailForSend: async () => ({ ok: true }),
}));

vi.mock('@/lib/firm-outreach/constants', () => ({
  dailySendCap: () => Number.MAX_SAFE_INTEGER,
  outreachSendEnabled: () => true,
  outreachEnabled: () => true,
}));

vi.mock('@robertcashman/firm-outreach-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@robertcashman/firm-outreach-core')>();
  return {
    ...actual,
    validateOutreachEnv: () => ({ ok: true, errors: [], warnings: [] }),
  };
});

import type { FirmProspect } from '@/lib/firm-outreach/types';
import type { EmailJob } from '@robertcashman/firm-outreach-core';
import { previewFirmOutreachDryRun } from '@/lib/firm-outreach/dry-run-preview';
import { runFirmOutreach } from '@/lib/firm-outreach/outreach/run-outreach';

function sentFollowUp(over: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: 'fop_fu',
    firmKey: 'followup',
    firmName: 'Followup LLP',
    email: 'crime@followup.co.uk',
    status: 'sent',
    sequenceStep: 0,
    lastEmailAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    campaignId: 'whatsapp_invite_v1',
    prospectType: 'firm',
    sources: ['laa'],
    priorityScore: 10,
    enrichAttempts: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('follow-up wouldSend / worker send path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // CI sets FIRM_OUTREACH_DRY_RUN=1 — worker path must be live for enqueue asserts.
    delete process.env.FIRM_OUTREACH_DRY_RUN;
    mockGetDailySendCount.mockResolvedValue(0);
    mockGetByIdem.mockResolvedValue(null);
    mockIdempotentJobs.mockResolvedValue(new Map());
    mockEnsureClaimable.mockResolvedValue(null);
    mockClaim.mockResolvedValue(null);
  });

  it('preview: due follow-up with no step-1 job yields wouldSendCount > 0', async () => {
    const fu = sentFollowUp();
    mockSelect.mockResolvedValue({
      candidates: [{ prospect: fu, step: 1 }],
      readyScanned: 0,
      sentScanned: 20,
      readyEligible: 0,
      followUpEligible: 1,
      skippedIndexedSend: 0,
      skippedIdempotentJob: 0,
      firmCooldownSkipped: 0,
      staleReadyToReconcile: [],
      staleFollowUpsToReconcile: [],
      readyIndexWalked: 0,
      selectionTimedOut: false,
    });

    const preview = await previewFirmOutreachDryRun({
      campaignId: 'whatsapp_invite_v1',
      limit: 40,
    });

    expect(preview.selection?.followUpEligible).toBe(1);
    expect(preview.selection?.sendableCandidates).toBe(1);
    expect(preview.wouldSendCount).toBeGreaterThan(0);
    expect(preview.preview.some((r) => r.wouldSend && r.step === 1)).toBe(true);
  });

  it('worker: enqueues and accepts a due follow-up (step 1) under unlimited batch', async () => {
    const fu = sentFollowUp();
    mockSelect.mockResolvedValue({
      candidates: [{ prospect: fu, step: 1 }],
      readyScanned: 0,
      sentScanned: 20,
      readyEligible: 0,
      followUpEligible: 1,
      skippedIndexedSend: 0,
      skippedIdempotentJob: 0,
      firmCooldownSkipped: 0,
      staleReadyToReconcile: [],
      staleFollowUpsToReconcile: [],
      readyIndexWalked: 0,
      selectionTimedOut: false,
    });

    const pendingJob: EmailJob = {
      id: 'job_fu_1',
      status: 'pending',
      campaignId: 'whatsapp_invite_v1',
      prospectId: fu.id,
      firmName: fu.firmName,
      prospectType: 'firm',
      email: 'crime@followup.co.uk',
      sequenceStep: 1,
      idempotencyKey: 'idem-fu-1',
      attemptCount: 0,
      maxAttempts: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockEnqueue.mockResolvedValue({ job: pendingJob, created: true, duplicate: false });
    // Phase A: empty queue. Phase C: claim the job we just enqueued.
    let claims = 0;
    mockClaim.mockImplementation(async () => {
      claims += 1;
      if (claims === 1) return null;
      if (claims === 2) {
        return {
          ...pendingJob,
          status: 'claimed' as const,
          claimedAt: new Date().toISOString(),
          claimOwner: 'test',
        };
      }
      return null;
    });
    mockGetProspect.mockResolvedValue(fu);
    mockSend.mockResolvedValue({
      ok: true,
      messageId: 're_fu_1',
      subject: 'Follow-up',
    });

    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      maxElapsedMs: 60_000,
    });

    expect(mockSelect).toHaveBeenCalled();
    const selectOpts = mockSelect.mock.calls[0]?.[0] as {
      readyLimit: number;
      sentLimit: number;
    };
    // Unlimited remaining must not collapse sent scan to 40.
    expect(selectOpts.sentLimit).toBeGreaterThanOrEqual(200);
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ sequenceStep: 1, email: 'crime@followup.co.uk' }),
    );
    expect(stats.jobsCreated ?? 0).toBeGreaterThan(0);
    expect(stats.accepted ?? stats.sent).toBeGreaterThan(0);
  });
});
