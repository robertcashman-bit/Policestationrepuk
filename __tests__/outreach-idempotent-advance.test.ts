/**
 * Regression for Mon 24 Aug 2026 production: RepUK ticks attempted 30+,
 * sent 0, almost all skipReasons.idempotent_exists — selection ranked
 * terminal-job ready rows ahead of never-mailed firms and burned the batch.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListIdsByStatus = vi.fn();
const mockGetProspectsByIds = vi.fn();
const mockListByStatus = vi.fn();
const mockIndexedSends = vi.fn();
const mockIdempotentJobs = vi.fn();
const mockListForFirm = vi.fn();
const mockGetDailySendCount = vi.fn();
const mockSend = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  addSuppression: vi.fn(),
  createSendRecord: vi.fn(() => ({ id: 'send-1' })),
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
  emailsWithIndexedSendsForCampaign: (...a: unknown[]) => mockIndexedSends(...a),
  getProspect: vi.fn(async () => null),
  getProspectsByIds: (...a: unknown[]) => mockGetProspectsByIds(...a),
  listProspectIdsByStatus: (...a: unknown[]) => mockListIdsByStatus(...a),
  listProspectsByRecordStatus: (...a: unknown[]) => mockListByStatus(...a),
  listProspectsForFirmKey: (...a: unknown[]) => mockListForFirm(...a),
  releaseDailySendSlot: vi.fn(),
  releaseHourlySendSlot: vi.fn(),
  reserveDailySendSlot: vi.fn(async () => ({ ok: true })),
  reserveHourlySendSlot: vi.fn(async () => ({ ok: true })),
  saveOutreachRunLog: vi.fn(),
  saveProspect: vi.fn(),
  saveSend: vi.fn(),
  utcHourBucket: () => '2026-08-24T08',
  refreshProspectStatusSnapshotCache: vi.fn(),
}));

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  claimNextEmailJob: vi.fn(async () => null),
  enqueueEmailJob: vi.fn(),
  emailsWithIdempotentJobsForCampaign: (...a: unknown[]) => mockIdempotentJobs(...a),
  getEmailJobByIdempotencyKey: vi.fn(async () => null),
  markJobAccepted: vi.fn(),
  markJobProcessing: vi.fn(),
  markJobRetryOrPermanent: vi.fn(),
  markJobSuppressed: vi.fn(),
  recoverAbandonedEmailJobs: vi.fn(async () => 0),
  requeueClaimedJob: vi.fn(),
}));

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

describe('runFirmOutreach advances past idempotent_exists clog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIRM_OUTREACH_DRY_RUN = 'true';
    mockGetDailySendCount.mockResolvedValue(0);
    mockListForFirm.mockResolvedValue([]);
    mockIndexedSends.mockResolvedValue(new Set<string>());
    mockListByStatus.mockResolvedValue([]);
    mockSend.mockResolvedValue({ ok: true, subject: 'Invite', messageId: 'msg-1' });
  });

  it('sends to a later unsent RepUK firm when the first N ready rows already have this campaign initial job', async () => {
    const clog = Array.from({ length: 25 }, (_, i) =>
      readyProspect({
        id: `fop_clog_${i}`,
        email: `clog${i}@firm.co.uk`,
        firmName: `Clog ${i}`,
        firmKey: `clog-${i}`,
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
    const ready = [...clog, unsent];
    mockListIdsByStatus.mockImplementation(async (status: string) => {
      if (status === 'ready_to_send') return ready.map((p) => p.id);
      return [];
    });
    mockGetProspectsByIds.mockImplementation(async (ids: string[]) => {
      const map = new Map<string, FirmProspect>();
      for (const id of ids) {
        const p = ready.find((row) => row.id === id);
        if (p) map.set(id, p);
      }
      return map;
    });
    mockIdempotentJobs.mockImplementation(async (emails: string[]) => {
      const map = new Map<string, { status: 'accepted' }>();
      for (const email of emails) {
        if (email !== 'crime@unsent.co.uk') map.set(email, { status: 'accepted' });
      }
      return map;
    });

    const { runFirmOutreach } = await import('@/lib/firm-outreach/outreach/run-outreach');
    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 5,
      dryRun: true,
    });

    expect(mockIdempotentJobs).toHaveBeenCalled();
    expect(stats.sent).toBe(1);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0]![0].prospect.id).toBe('fop_unsent');
    expect(stats.skipReasons?.idempotent_exists ?? 0).toBe(0);
  });
});
