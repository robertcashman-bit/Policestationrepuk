/**
 * Live Mon 24 Aug 2026 (c64fc35): preview wouldSendCount=3 / sendableCandidates=15
 * but worker jobsCreated=0, accepted=0, often empty skipReasons.
 *
 * Root cause: selection/preview only treat terminal jobs as blockers; enqueue is
 * idempotent on ANY job. Non-terminal orphans (pending missing from zset,
 * failed/deferred, stuck claimed) → silent duplicate → nothing claimable.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSaveProspect = vi.fn();
const mockEnqueue = vi.fn();
const mockClaim = vi.fn();
const mockGetProspect = vi.fn();
const mockSelect = vi.fn();
const mockSend = vi.fn();
const mockGetDailySendCount = vi.fn();
const mockGetByIdem = vi.fn();
const mockEnsureClaimable = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  addSuppression: vi.fn(),
  createSendRecord: vi.fn(() => ({
    id: 'send-1',
    status: 'queued',
    prospectId: 'fop_orphan',
    email: 'crime@orphan.co.uk',
    campaignId: 'whatsapp_invite_v1',
    sequenceStep: 0,
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
  utcHourBucket: () => '2026-08-24T11',
  refreshProspectStatusSnapshotCache: vi.fn(),
}));

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  claimNextEmailJob: (...a: unknown[]) => mockClaim(...a),
  claimEmailJobById: vi.fn(async () => null),
  enqueueEmailJob: (...a: unknown[]) => mockEnqueue(...a),
  emailsWithIdempotentJobsForCampaign: vi.fn(async () => new Map()),
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

function readyProspect(over: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: 'fop_orphan',
    firmKey: 'orphan',
    firmName: 'Orphan LLP',
    email: 'crime@orphan.co.uk',
    status: 'ready_to_send',
    sequenceStep: 0,
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

function orphanJob(status: EmailJob['status']): EmailJob {
  return {
    id: 'job_orphan',
    idempotencyKey: 'idem_orphan',
    campaignId: 'whatsapp_invite_v1',
    prospectId: 'fop_orphan',
    firmName: 'Orphan LLP',
    prospectType: 'firm',
    email: 'crime@orphan.co.uk',
    sequenceStep: 0,
    status,
    attemptCount: status === 'failed' ? 1 : 0,
    maxAttempts: 5,
    createdAt: '2026-08-24T09:00:00.000Z',
    updatedAt: '2026-08-24T09:00:00.000Z',
  };
}

describe('preview wouldSend>0 but jobsCreated=0 → heal + drain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FIRM_OUTREACH_DRY_RUN;
    mockGetDailySendCount.mockResolvedValue(0);
    mockSaveProspect.mockResolvedValue(undefined);
    mockSend.mockResolvedValue({ ok: true, subject: 'Invite', messageId: 'msg-1' });
  });

  it.each(['pending', 'failed', 'deferred', 'claimed'] as const)(
    'heals existing %s job and accepts without creating a new job',
    async (status) => {
      const prospect = readyProspect();
      const existing = orphanJob(status);
      const healed = { ...existing, status: 'pending' as const };

      mockSelect.mockResolvedValue({
        candidates: [{ prospect, step: 0 }],
        readyScanned: 15,
        sentScanned: 0,
        readyEligible: 15,
        followUpEligible: 0,
        skippedIndexedSend: 0,
        skippedIdempotentJob: 0,
        firmCooldownSkipped: 0,
        staleReadyToReconcile: [],
        readyIndexWalked: 15,
        selectionTimedOut: false,
      });

      // Phase A: nothing claimable yet (orphan not on zset).
      // Phase C: after heal, claim succeeds once.
      let claims = 0;
      mockClaim.mockImplementation(async () => {
        claims += 1;
        if (claims === 1) return null; // Phase A
        if (claims === 2) {
          return {
            ...healed,
            status: 'claimed',
            claimedAt: new Date().toISOString(),
            claimOwner: 'test',
          };
        }
        return null;
      });

      mockGetByIdem.mockResolvedValue(existing);
      mockEnsureClaimable.mockResolvedValue(healed);
      mockGetProspect.mockResolvedValue(prospect);
      mockEnqueue.mockResolvedValue({
        job: existing,
        created: false,
        duplicate: true,
      });

      const { runFirmOutreach } = await import('@/lib/firm-outreach/outreach/run-outreach');
      const stats = await runFirmOutreach({
        campaignId: 'whatsapp_invite_v1',
        limit: 45,
        maxElapsedMs: 60_000,
      });

      expect(mockEnsureClaimable).toHaveBeenCalled();
      expect(stats.jobsCreated ?? 0).toBe(0);
      expect(stats.accepted ?? 0).toBeGreaterThan(0);
      expect(stats.sent).toBeGreaterThan(0);
      expect(mockSend).toHaveBeenCalled();
      // Must not be a silent empty skipReasons when we healed+sent.
      expect(stats.skipReasons?.idempotent_exists ?? 0).toBe(0);
    },
  );

  it('records idempotent_exists (never silent) when heal refuses a provider-accepted job', async () => {
    const prospect = readyProspect();
    const existing = {
      ...orphanJob('failed'),
      providerMessageId: 'msg_already',
    };

    mockSelect.mockResolvedValue({
      candidates: [{ prospect, step: 0 }],
      readyScanned: 1,
      sentScanned: 0,
      readyEligible: 1,
      followUpEligible: 0,
      skippedIndexedSend: 0,
      skippedIdempotentJob: 0,
      firmCooldownSkipped: 0,
      staleReadyToReconcile: [],
      readyIndexWalked: 1,
      selectionTimedOut: false,
    });
    mockClaim.mockResolvedValue(null);
    mockGetByIdem.mockResolvedValue(existing);
    mockEnsureClaimable.mockResolvedValue(null);
    mockEnqueue.mockResolvedValue({ job: existing, created: false, duplicate: true });

    const { runFirmOutreach } = await import('@/lib/firm-outreach/outreach/run-outreach');
    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 45,
      maxElapsedMs: 60_000,
    });

    expect(stats.jobsCreated ?? 0).toBe(0);
    expect(stats.accepted ?? 0).toBe(0);
    expect(stats.skipReasons?.idempotent_exists ?? 0).toBeGreaterThan(0);
  });

  it('same tick: priority-drains healed job and clears stale prospect claim', async () => {
    const prospect = readyProspect();
    const existing = orphanJob('pending');
    const healed = { ...existing, status: 'pending' as const };

    mockSelect.mockResolvedValue({
      candidates: [{ prospect, step: 0 }],
      readyScanned: 1,
      sentScanned: 0,
      readyEligible: 1,
      followUpEligible: 0,
      skippedIndexedSend: 0,
      skippedIdempotentJob: 0,
      firmCooldownSkipped: 0,
      staleReadyToReconcile: [],
      staleFollowUpsToReconcile: [],
      readyIndexWalked: 1,
      selectionTimedOut: false,
    });

    mockClaim.mockResolvedValue(null); // Phase A empty; Phase C uses claimEmailJobById
    mockGetByIdem.mockResolvedValue(existing);
    mockEnsureClaimable.mockResolvedValue(healed);
    mockGetProspect.mockResolvedValue(prospect);
    mockEnqueue.mockResolvedValue({ job: existing, created: false, duplicate: true });

    const { claimEmailJobById } = await import('@/lib/firm-outreach/email-jobs/storage');
    const { claimProspectSend, releaseProspectSend } = await import(
      '@/lib/firm-outreach/run-lock'
    );
    vi.mocked(claimEmailJobById).mockImplementation(async ({ jobId }) => {
      if (jobId !== healed.id) return null;
      return {
        ...healed,
        status: 'claimed',
        claimedAt: new Date().toISOString(),
        claimOwner: 'test',
      };
    });
    // First claim fails (stale NX), release + retry succeeds.
    vi.mocked(claimProspectSend)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);

    const { runFirmOutreach } = await import('@/lib/firm-outreach/outreach/run-outreach');
    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 45,
      maxElapsedMs: 60_000,
    });

    expect(mockEnsureClaimable).toHaveBeenCalled();
    expect(releaseProspectSend).toHaveBeenCalledWith(prospect.id);
    expect(claimEmailJobById).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: healed.id }),
    );
    expect(stats.accepted ?? 0).toBeGreaterThan(0);
    expect(stats.jobsCreated ?? 0).toBe(0);
  });
});
