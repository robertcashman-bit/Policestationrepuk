/**
 * Autotest for the 2026-08-21 production failure:
 * Digest: 482 RepUK sendable · Sent today: 0
 *
 * Root cause: PR #13 campaign-scoped candidate selection, but
 * outreachEmailSendBlocker still treated agent_cover_kent_v1 initials as
 * cross-campaign duplicates — every cron tick skipped enqueue/send.
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
}));
vi.mock('@/lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: (...a: unknown[]) => mockIsSendAllowed(...a),
}));
vi.mock('@robertcashman/firm-outreach-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@robertcashman/firm-outreach-core')>();
  return {
    ...actual,
    validateOutreachEnv: () => ({ ok: true, errors: [], warnings: [], sendingEnabled: true, dryRun: false }),
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
      campaignIds?: readonly string[];
    }) => {
      const { SENDABLE_OUTREACH_CAMPAIGN_IDS, isOutreachCampaignSendable } = await import(
        '@/lib/firm-outreach/site-config'
      );
      const campaignIds = (opts?.campaignIds ?? SENDABLE_OUTREACH_CAMPAIGN_IDS).filter((id) =>
        isOutreachCampaignSendable(id),
      );
      const byCampaign: Record<string, unknown> = {};
      for (const campaignId of campaignIds) {
        byCampaign[campaignId] = await mockRunFirmOutreach({
          campaignId,
          dryRun: opts?.dryRun,
          limit: opts?.limit,
          maxElapsedMs: opts?.maxElapsedMs,
        });
      }
      return {
        byCampaign,
        combined: actual.mergeOutreachRunStats(
          ...(Object.values(byCampaign) as Parameters<typeof actual.mergeOutreachRunStats>),
        ),
      };
    },
  };
});

import { outreachEmailSendBlocker } from '@/lib/firm-outreach/outreach/send-gates';
import { runOutreachWorkerTick } from '@/lib/firm-outreach/outreach/run-worker';
import { SENDABLE_OUTREACH_CAMPAIGN_IDS } from '@/lib/firm-outreach/site-config';
import { sendOutreachEmail } from '@/lib/firm-outreach/outreach/send';
import type { FirmProspect } from '@/lib/firm-outreach/types';

function psaHistoryOnly() {
  return [
    {
      id: 'fos_psa',
      prospectId: 'fop_psa',
      email: 'crime@readyfirm.co.uk',
      campaignId: 'agent_cover_kent_v1',
      sequenceStep: 0,
      status: 'sent',
      sentAt: '2026-08-05T10:00:00.000Z',
      createdAt: '2026-08-05T10:00:00.000Z',
    },
  ];
}

describe('RepUK send worker vs PSA history (482 ready / 0 sent)', () => {
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
    mockListSends.mockResolvedValue(psaHistoryOnly());
    mockSuppressed.mockResolvedValue(false);
    mockClaimLock.mockResolvedValue(true);
    mockIsSendAllowed.mockResolvedValue(true);
    mockRunFirmOutreach.mockResolvedValue({
      sent: 12,
      accepted: 12,
      skipped: 0,
      errors: 0,
      jobsClaimed: 12,
      jobsCreated: 0,
      campaignId: 'whatsapp_invite_v1',
    });
  });

  it('only schedules the RepUK campaign on the worker tick', async () => {
    expect([...SENDABLE_OUTREACH_CAMPAIGN_IDS]).toEqual(['whatsapp_invite_v1']);
    const result = await runOutreachWorkerTick({ limit: 50 });
    expect(result.skipped).toBeUndefined();
    expect(result.accepted).toBe(12);
    expect(mockRunFirmOutreach).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: 'whatsapp_invite_v1' }),
    );
    expect(mockRunFirmOutreach).not.toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: 'agent_cover_kent_v1' }),
    );
  });

  it('lets RepUK enqueue past PSA-only history that used to zero the day', async () => {
    // Simulate the live gate check for one of the 482 "sendable" rows.
    await expect(
      outreachEmailSendBlocker({
        email: 'crime@readyfirm.co.uk',
        prospectId: 'fop_repuk_ready',
        campaignId: 'whatsapp_invite_v1',
        step: 0,
        emailsSentThisRun: new Set(),
        today: '2026-08-21',
      }),
    ).resolves.toBeNull();
  });

  it('still hard-refuses live PSA / Kent-cover provider sends', async () => {
    const prospect: FirmProspect = {
      id: 'agent_cover_kent_v1:firm',
      campaignId: 'agent_cover_kent_v1',
      firmName: 'Kent Cover Target',
      firmKey: 'kent-cover-target',
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
    expect(result.error).toBe('agent_cover_outreach_permanently_disabled');
  });
});
