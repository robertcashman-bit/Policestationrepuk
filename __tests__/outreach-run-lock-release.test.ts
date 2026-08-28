/**
 * Autotest for 2026-08-23 outage: status 504 + send ticks accepted=0.
 * Updated 2026-08-28: firm outreach email permanently off — worker skips
 * before claiming the send lock.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

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
    runFirmOutreachAllCampaigns: async () => {
      throw new Error('should not reach campaign send while email permanently disabled');
    },
  };
});

import { runOutreachWorkerTick } from '@/lib/firm-outreach/outreach/run-worker';
import { outreachRunLockKey } from '@/lib/firm-outreach/run-lock';

describe('outreach run lock release', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClaimLock.mockResolvedValue(true);
    mockIsSendAllowed.mockResolvedValue(true);
    mockRunFirmOutreach.mockResolvedValue({
      sent: 5,
      accepted: 5,
      skipped: 0,
      errors: 0,
      jobsClaimed: 5,
      jobsCreated: 0,
      campaignId: 'whatsapp_invite_v1',
    });
  });

  it('skips before claiming lock while firm outreach email is permanently disabled', async () => {
    const result = await runOutreachWorkerTick({ limit: 5 });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(result.accepted).toBe(0);
    expect(mockClaimLock).not.toHaveBeenCalled();
    expect(mockReleaseLock).not.toHaveBeenCalled();
    expect(mockRunFirmOutreach).not.toHaveBeenCalled();
  });

  it('uses a distinct lock key per mode', () => {
    expect(outreachRunLockKey('send')).toBe('firmoutreach:lock:send');
    expect(outreachRunLockKey('autoheal')).toBe('firmoutreach:lock:autoheal');
  });
});
