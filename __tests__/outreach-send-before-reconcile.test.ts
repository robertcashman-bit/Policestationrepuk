/**
 * Live c64fc35: ticks spent ~200s reconciling stale ready and exited with
 * attempted=0 / sent=0. Same tick must enqueue+send BEFORE post-send reconcile.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSaveProspect = vi.fn();
const mockEnqueue = vi.fn();
const mockClaim = vi.fn();
const mockGetProspect = vi.fn();
const mockSelect = vi.fn();
const mockSend = vi.fn();
const mockGetDailySendCount = vi.fn();
const callOrder: string[] = [];

vi.mock('@/lib/firm-outreach/storage', () => ({
  addSuppression: vi.fn(),
  createSendRecord: vi.fn(() => ({
    id: 'send-1',
    status: 'queued',
    prospectId: 'fop_unsent',
    email: 'crime@unsent.co.uk',
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
  enqueueEmailJob: (...a: unknown[]) => mockEnqueue(...a),
  emailsWithIdempotentJobsForCampaign: vi.fn(async () => new Map()),
  getEmailJobByIdempotencyKey: vi.fn(async () => null),
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

function readyProspect(over: Partial<FirmProspect>): FirmProspect {
  return {
    id: 'fop_x',
    firmKey: 'firm-x',
    firmName: 'Firm X',
    email: 'x@example.com',
    status: 'ready_to_send',
    sequenceStep: 0,
    campaignId: 'whatsapp_invite_v1',
    prospectType: 'firm',
    sources: ['laa'],
    priorityScore: 0,
    enrichAttempts: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('runFirmOutreach send-before-reconcile (c64fc35 live failure)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callOrder.length = 0;
    delete process.env.FIRM_OUTREACH_DRY_RUN;
    mockGetDailySendCount.mockResolvedValue(0);
    mockSend.mockImplementation(async () => {
      callOrder.push('send');
      return { ok: true, subject: 'Invite', messageId: 'msg-1' };
    });
    mockSaveProspect.mockImplementation(async () => {
      callOrder.push('saveProspect');
      // Simulate slow KV writes that previously ate the tick before enqueue.
      await new Promise((r) => setTimeout(r, 5));
    });
  });

  it('accepts/sends a later unsent firm in the same tick before reconciling thousands of stale-ready rows', async () => {
    const stale = Array.from({ length: 200 }, (_, i) =>
      readyProspect({
        id: `fop_stale_${i}`,
        email: `stale${i}@clog.co.uk`,
        firmName: `Stale ${i}`,
        firmKey: `stale-${i}`,
        priorityScore: 90,
      }),
    );
    const unsent = readyProspect({
      id: 'fop_unsent',
      email: 'crime@unsent.co.uk',
      firmName: 'Unsent LLP',
      firmKey: 'unsent',
      priorityScore: 2,
    });

    mockSelect.mockImplementation(async () => {
      callOrder.push('select');
      return {
        candidates: [{ prospect: unsent, step: 0 }],
        readyScanned: 2500,
        sentScanned: 0,
        readyEligible: 1,
        followUpEligible: 0,
        skippedIndexedSend: 0,
        skippedIdempotentJob: 2000,
        firmCooldownSkipped: 0,
        staleReadyToReconcile: stale.map((prospect) => ({
          prospect,
          reason: 'accepted' as const,
          lastEmailAt: '2026-08-22T15:00:00.000Z',
        })),
        readyIndexWalked: 2500,
        selectionTimedOut: false,
      };
    });

    mockEnqueue.mockImplementation(async (input: { email: string; prospectId: string }) => {
      callOrder.push('enqueue');
      return {
        created: true,
        duplicate: false,
        job: {
          id: 'foj_1',
          idempotencyKey: 'idem',
          campaignId: 'whatsapp_invite_v1',
          prospectId: input.prospectId,
          firmName: 'Unsent LLP',
          prospectType: 'firm',
          email: input.email,
          sequenceStep: 0,
          status: 'pending',
          attemptCount: 0,
          maxAttempts: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          correlationId: 'corr',
        },
      };
    });

    let claims = 0;
    mockClaim.mockImplementation(async () => {
      // Phase A drain must not steal the job before Phase B enqueue.
      if (!callOrder.includes('enqueue')) return null;
      claims += 1;
      if (claims > 1) return null;
      callOrder.push('claim');
      return {
        id: 'foj_1',
        idempotencyKey: 'idem',
        campaignId: 'whatsapp_invite_v1',
        prospectId: 'fop_unsent',
        firmName: 'Unsent LLP',
        prospectType: 'firm',
        email: 'crime@unsent.co.uk',
        sequenceStep: 0,
        status: 'claimed',
        attemptCount: 1,
        maxAttempts: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        correlationId: 'corr',
      };
    });
    mockGetProspect.mockResolvedValue(unsent);

    const { runFirmOutreach } = await import('@/lib/firm-outreach/outreach/run-outreach');
    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 5,
      maxElapsedMs: 60_000,
      dryRun: false,
    });

    expect(stats.sent).toBeGreaterThan(0);
    expect(stats.accepted ?? stats.sent).toBeGreaterThan(0);
    expect(stats.jobsCreated ?? 0).toBeGreaterThan(0);

    const enqueueIdx = callOrder.indexOf('enqueue');
    const sendIdx = callOrder.indexOf('send');
    const firstReconcileIdx = callOrder.indexOf('saveProspect');
    expect(enqueueIdx).toBeGreaterThanOrEqual(0);
    expect(sendIdx).toBeGreaterThanOrEqual(0);
    // Reconcile (saveProspect for stale ready) must not precede enqueue/send.
    if (firstReconcileIdx >= 0) {
      expect(firstReconcileIdx).toBeGreaterThan(enqueueIdx);
      expect(firstReconcileIdx).toBeGreaterThan(sendIdx);
    }
  });
});
