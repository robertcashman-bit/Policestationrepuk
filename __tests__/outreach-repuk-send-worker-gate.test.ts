/**
 * Autotest: firm outreach email permanently off — worker never schedules sends.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListSends = vi.fn(async () => [] as unknown[]);
const mockSuppressed = vi.fn(async () => false);
const mockRunFirmOutreach = vi.fn();
const mockClaimLock = vi.fn(async () => true);
const mockIsSendAllowed = vi.fn(async () => true);
const mockCapacity = vi.fn(async () => ({
  psa: { eligibleUnsent: 0, pendingJobs: 0, providerRemainingToday: 90 },
  repuk: { eligibleUnsent: 482, pendingJobs: 0, providerRemainingToday: 90 },
}));
const mockRecover = vi.fn(async () => 0);
const mockSaveJobRun = vi.fn(async () => undefined);
const mockNewJobRunId = vi.fn(() => 'worker_test');

vi.mock('@/lib/firm-outreach/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-outreach/storage')>();
  return {
    ...actual,
    isSuppressed: (...args: unknown[]) => mockSuppressed(...args),
    listSendsForEmail: (...args: unknown[]) => mockListSends(...args),
  };
});

vi.mock('@/lib/firm-outreach/capacity', () => ({
  getAllWorkspacesCapacity: (...a: unknown[]) => mockCapacity(...a),
}));
vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  recoverAbandonedEmailJobs: (...a: unknown[]) => mockRecover(...a),
}));
vi.mock('@/lib/firm-outreach/job-runs', () => ({
  newJobRunId: (...a: unknown[]) => mockNewJobRunId(...a),
  saveJobRun: (...a: unknown[]) => mockSaveJobRun(...a),
}));
vi.mock('@/lib/firm-outreach/run-lock', () => ({
  claimOutreachRunLock: (...a: unknown[]) => mockClaimLock(...a),
  releaseOutreachRunLock: vi.fn(async () => undefined),
  claimProspectSend: vi.fn(async () => true),
  releaseProspectSend: vi.fn(async () => undefined),
}));
vi.mock('@/lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: (...a: unknown[]) => mockIsSendAllowed(...a),
}));
vi.mock('@robertcashman/firm-outreach-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@robertcashman/firm-outreach-core')>();
  return {
    ...actual,
    validateOutreachEnv: () => ({
      ok: true,
      errors: [],
      warnings: [],
      sendingEnabled: true,
      dryRun: false,
    }),
  };
});
vi.mock('@/lib/firm-outreach/outreach/run-outreach', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-outreach/outreach/run-outreach')>();
  return {
    ...actual,
    runFirmOutreach: (...args: unknown[]) => mockRunFirmOutreach(...args),
  };
});

import { runOutreachWorkerTick } from '@/lib/firm-outreach/outreach/run-worker';
import {
  FIRM_OUTREACH_EMAIL_DISABLED_REASON,
  SENDABLE_OUTREACH_CAMPAIGN_IDS,
} from '@/lib/firm-outreach/site-config';
import { sendOutreachEmail } from '@/lib/firm-outreach/outreach/send';
import type { FirmProspect } from '@/lib/firm-outreach/types';

describe('RepUK send worker permanently disabled', () => {
  const ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...ENV,
      FIRM_OUTREACH_REQUIRE_APPROVAL: 'false',
      FIRM_OUTREACH_SEND_ENABLED: 'true',
      FIRM_OUTREACH_ENABLED: 'true',
    };
    delete process.env.FIRM_OUTREACH_PAUSED;
    delete process.env.FIRM_OUTREACH_DRY_RUN;
    mockClaimLock.mockResolvedValue(true);
    mockIsSendAllowed.mockResolvedValue(true);
  });

  it('has empty sendable campaign list', () => {
    expect([...SENDABLE_OUTREACH_CAMPAIGN_IDS]).toEqual([]);
  });

  it('skips worker tick with accepted=0 even when env says send enabled', async () => {
    const result = await runOutreachWorkerTick({ limit: 50 });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(result.accepted).toBe(0);
    expect(mockRunFirmOutreach).not.toHaveBeenCalled();
  });

  it('hard-refuses live RepUK and PSA provider sends', async () => {
    for (const campaignId of ['whatsapp_invite_v1', 'agent_cover_kent_v1'] as const) {
      const prospect: FirmProspect = {
        id: `${campaignId}:firm`,
        campaignId,
        firmName: 'Target Firm',
        firmKey: 'target-firm',
        prospectType: 'firm',
        email: 'crime@readyfirm.co.uk',
        status: 'ready_to_send',
        sources: ['manual'],
        sequenceStep: 0,
        priorityScore: 50,
        enrichAttempts: 0,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      };
      const result = await sendOutreachEmail({ prospect, step: 0 });
      expect(result.ok).toBe(false);
      expect(result.error).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    }
  });
});
