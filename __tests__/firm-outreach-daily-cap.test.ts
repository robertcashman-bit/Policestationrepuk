import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetDailySendCount = vi.fn();
const mockListReady = vi.fn();
const mockSend = vi.fn();

vi.mock('../lib/firm-outreach/storage', () => ({
  addSuppression: vi.fn(),
  createSendRecord: vi.fn(() => ({ id: 'send-1' })),
  excludeProspectDuplicateEmail: vi.fn(),
  getDailySendCount: (...args: unknown[]) => mockGetDailySendCount(...args),
  getGlobalResendQuotaRemaining: vi.fn(async () => 100),
  getSuppression: vi.fn(async () => null),
  incrementDailySendCount: vi.fn(),
  incrementResendSendCount: vi.fn(),
  isDuplicateInitialSend: vi.fn(async () => false),
  isSuppressed: vi.fn(async () => false),
  listProspectsByRecordStatus: vi.fn(async () => []),
  listProspectsForFirmKey: vi.fn(async () => []),
  releaseDailySendSlot: vi.fn(),
  releaseHourlySendSlot: vi.fn(),
  reserveDailySendSlot: vi.fn(async () => ({ ok: true })),
  reserveHourlySendSlot: vi.fn(async () => ({ ok: true })),
  saveOutreachRunLog: vi.fn(),
  saveProspect: vi.fn(),
  saveSend: vi.fn(),
  utcHourBucket: () => '2026-08-02T11',
  refreshProspectStatusSnapshotCache: vi.fn(),
}));

vi.mock('../lib/firm-outreach/outreach/send', () => ({
  sendOutreachEmail: (...args: unknown[]) => mockSend(...args),
}));

vi.mock('../lib/firm-outreach/run-lock', () => ({
  claimProspectSend: vi.fn(async () => true),
}));

vi.mock('../lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: vi.fn(async () => true),
}));

vi.mock('../lib/firm-outreach/outreach/from-address', () => ({
  assertOutreachSendReady: vi.fn(async () => ({ ok: true })),
}));

vi.mock('../lib/firm-outreach/outreach/candidate-selection', () => ({
  firmRecentlyContacted: vi.fn(async () => false),
  selectOutreachCandidates: vi.fn(async () => {
    const ready = await mockListReady();
    return {
      readyScanned: ready.length,
      sentScanned: 0,
      readyEligible: ready.length,
      followUpEligible: 0,
      firmCooldownSkipped: 0,
      candidates: ready.map((prospect: { id: string }) => ({ prospect, step: 0 })),
    };
  }),
}));

vi.mock('../lib/firm-outreach/email-jobs/storage', () => ({
  claimNextEmailJob: vi.fn(async () => null),
  enqueueEmailJob: vi.fn(),
  markJobAccepted: vi.fn(),
  markJobProcessing: vi.fn(),
  markJobRetryOrPermanent: vi.fn(),
  markJobSuppressed: vi.fn(),
  recoverAbandonedEmailJobs: vi.fn(async () => 0),
  requeueClaimedJob: vi.fn(),
}));

vi.mock('../lib/firm-outreach/qualification', () => ({
  qualifyProspectForOutreach: () => ({ qualified: true }),
  resolveStatusWithQualification: (_p: unknown, status: string) => status,
}));

vi.mock('../lib/firm-outreach/enrichment/validator', () => ({
  isPlausibleOutreachEmail: () => true,
  validateEmailForSend: async () => ({ ok: true }),
}));

vi.mock('../lib/firm-outreach/constants', () => ({
  dailySendCap: () => 50,
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

function readyProspect(id: string) {
  return {
    id,
    firmKey: `firm-${id}`,
    firmName: `Firm ${id}`,
    email: `${id}@example.com`,
    status: 'ready_to_send',
    sequenceStep: 0,
    campaignId: 'whatsapp_invite_v1',
    prospectType: 'firm',
    sources: ['laa'] as string[],
    priorityScore: 0,
    enrichAttempts: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('runFirmOutreach daily cap vs batch limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIRM_OUTREACH_DRY_RUN = 'true';
    mockSend.mockResolvedValue({ ok: true, subject: 'Hello', messageId: 'msg-1' });
  });

  it('uses remaining daily cap on later ticks when batch limit is smaller', async () => {
    mockGetDailySendCount.mockResolvedValue(25);
    mockListReady.mockResolvedValue(
      Array.from({ length: 40 }, (_, i) => readyProspect(`p${i + 1}`)),
    );

    const { runFirmOutreach } = await import('../lib/firm-outreach/outreach/run-outreach');
    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 25,
    });

    // Cap 50, already 25 → remaining 25; batch limit 25 → send 25 in dry-run.
    expect(stats.sent).toBe(25);
    expect(mockSend).toHaveBeenCalledTimes(25);
  });
});
