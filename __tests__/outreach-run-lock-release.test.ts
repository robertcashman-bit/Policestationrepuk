/**
 * Autotest for 2026-08-23 outage: status 504 + send ticks accepted=0.
 * A hung/timed-out worker that never released the send lock left later ticks
 * on overlap for hours. Status dual-scanned ~1200 rows/campaign under maxDuration=60.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClaimLock = vi.fn(async () => true);
const mockReleaseLock = vi.fn(async () => undefined);
const mockIsSendAllowed = vi.fn(async () => true);
const mockCapacity = vi.fn(async () => ({
  psa: { eligibleUnsent: 0, pendingJobs: 0, providerRemainingToday: 90 },
  repuk: { eligibleUnsent: 490, pendingJobs: 0, providerRemainingToday: 90 },
}));
const mockRecover = vi.fn(async () => 0);
const mockSaveJobRun = vi.fn(async () => undefined);
const mockNewJobRunId = vi.fn(() => 'worker_lock_test');
const mockRunFirmOutreach = vi.fn();

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
  releaseOutreachRunLock: (...a: unknown[]) => mockReleaseLock(...a),
  outreachRunLockKey: (mode: string) => `firmoutreach:lock:${mode}`,
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
    runFirmOutreachAllCampaigns: async (opts?: {
      dryRun?: boolean;
      limit?: number;
      maxElapsedMs?: number;
    }) => {
      const stats = await mockRunFirmOutreach({
        campaignId: 'whatsapp_invite_v1',
        ...opts,
      });
      return {
        byCampaign: { whatsapp_invite_v1: stats },
        combined: actual.mergeOutreachRunStats(stats),
      };
    },
  };
});

import { runOutreachWorkerTick } from '@/lib/firm-outreach/outreach/run-worker';
import { outreachRunLockKey } from '@/lib/firm-outreach/run-lock';

describe('outreach run lock release', () => {
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
    mockReleaseLock.mockResolvedValue(undefined);
    mockIsSendAllowed.mockResolvedValue(true);
    mockRunFirmOutreach.mockResolvedValue({
      sent: 5,
      accepted: 5,
      skipped: 0,
      errors: 0,
      jobsClaimed: 5,
      jobsCreated: 0,
    });
  });

  it('releases the send lock after a successful worker tick', async () => {
    const result = await runOutreachWorkerTick({ limit: 5 });
    expect(result.accepted).toBe(5);
    expect(mockClaimLock).toHaveBeenCalledWith('send');
    expect(mockReleaseLock).toHaveBeenCalledWith('send');
  });

  it('releases the send lock when the campaign run throws', async () => {
    mockRunFirmOutreach.mockRejectedValueOnce(new Error('provider timeout'));
    await expect(runOutreachWorkerTick({ limit: 5 })).rejects.toThrow(/provider timeout/);
    expect(mockClaimLock).toHaveBeenCalledWith('send');
    expect(mockReleaseLock).toHaveBeenCalledWith('send');
  });

  it('does not release when the lock was never claimed (overlap skip)', async () => {
    mockClaimLock.mockResolvedValueOnce(false);
    const result = await runOutreachWorkerTick({ limit: 5 });
    expect(result.reason).toBe('overlap');
    expect(result.accepted).toBe(0);
    expect(mockReleaseLock).not.toHaveBeenCalled();
  });

  it('uses a distinct lock key per mode', () => {
    expect(outreachRunLockKey('send')).toBe('firmoutreach:lock:send');
    expect(outreachRunLockKey('autoheal')).toBe('firmoutreach:lock:autoheal');
  });
});
