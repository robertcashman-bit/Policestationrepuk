import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListIdsByStatus = vi.fn();
const mockGetProspectsByIds = vi.fn();
const mockListByStatus = vi.fn();
const mockIndexedSends = vi.fn();
const mockIdempotentJobs = vi.fn();
const mockListForFirm = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  listProspectIdsByStatus: (...a: unknown[]) => mockListIdsByStatus(...a),
  getProspectsByIds: (...a: unknown[]) => mockGetProspectsByIds(...a),
  listProspectsByRecordStatus: (...a: unknown[]) => mockListByStatus(...a),
  emailsWithIndexedSendsForCampaign: (...a: unknown[]) => mockIndexedSends(...a),
  emailHasIndexedSend: vi.fn(),
  listProspectsForFirmKey: (...a: unknown[]) => mockListForFirm(...a),
}));

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  emailsWithIdempotentJobsForCampaign: (...a: unknown[]) => mockIdempotentJobs(...a),
}));

import { readyProspectScanLimit, selectOutreachCandidates } from '@/lib/firm-outreach/outreach/candidate-selection';
import type { FirmProspect } from '@/lib/firm-outreach/types';

function prospect(over: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: 'fop_new',
    prospectType: 'firm',
    firmName: 'New Firm',
    firmKey: 'new-firm',
    sources: ['laa'],
    status: 'ready_to_send',
    priorityScore: 10,
    sequenceStep: 0,
    campaignId: 'whatsapp_invite_v1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    enrichAttempts: 1,
    email: 'crime@newfirm.co.uk',
    ...over,
  };
}

/** Wire ready-index walk mocks from an ordered ready list. */
function mockReadyPile(ready: FirmProspect[], sent: FirmProspect[] = []) {
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
  mockListByStatus.mockImplementation(async (status: string) => {
    if (status === 'sent') return sent;
    return [];
  });
}

describe('selectOutreachCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListForFirm.mockResolvedValue([]);
    mockIndexedSends.mockResolvedValue(new Set<string>());
    mockIdempotentJobs.mockResolvedValue(new Map());
  });

  it('drops ready inboxes that already have indexed sends so follow-ups can run', async () => {
    const alreadyMailed = prospect({
      id: 'fop_old',
      email: 'info@oldfirm.co.uk',
      firmName: 'Old Firm',
      priorityScore: 99,
    });
    const fresh = prospect({ id: 'fop_fresh', email: 'duty@fresh.co.uk' });
    const followUp = prospect({
      id: 'fop_fu',
      status: 'sent',
      sequenceStep: 0,
      lastEmailAt: new Date(Date.now() - 8 * 86_400_000).toISOString(),
      email: 'crime@followup.co.uk',
    });
    mockReadyPile([alreadyMailed, fresh], [followUp]);
    mockIndexedSends.mockResolvedValue(new Set(['info@oldfirm.co.uk']));

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 50,
      sentLimit: 50,
    });

    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_fresh', 'fop_fu']);
    expect(result.readyEligible).toBe(1);
    expect(result.followUpEligible).toBe(1);
    expect(result.skippedIndexedSend).toBe(1);
    expect(result.staleReadyToReconcile).toHaveLength(1);
    expect(result.staleReadyToReconcile[0]?.reason).toBe('indexed_send');
  });

  it('scans past a clogged already-mailed prefix to reach a fresh inbox', async () => {
    const clog = Array.from({ length: 40 }, (_, i) =>
      prospect({
        id: `fop_old_${i}`,
        email: `info${i}@oldfirm.co.uk`,
        firmName: `Old Firm ${i}`,
        priorityScore: 90,
      }),
    );
    const fresh = prospect({
      id: 'fop_fresh',
      email: 'duty@fresh.co.uk',
      priorityScore: 5,
    });
    mockReadyPile([...clog, fresh]);
    mockIndexedSends.mockResolvedValue(
      new Set(clog.map((p) => p.email as string)),
    );

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 8,
      sentLimit: 8,
    });

    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_fresh']);
    expect(result.skippedIndexedSend).toBe(40);
    expect(result.readyEligible).toBe(1);
  });

  it('advances past ready firms with terminal RepUK jobs (idempotent_exists) to an unsent firm', async () => {
    const clog = Array.from({ length: 30 }, (_, i) =>
      prospect({
        id: `fop_jobbed_${i}`,
        email: `info${i}@jobbed.co.uk`,
        firmName: `Jobbed Firm ${i}`,
        priorityScore: 95,
      }),
    );
    const fresh = prospect({
      id: 'fop_unsent',
      email: 'crime@unsent.co.uk',
      firmName: 'Unsent Firm',
      priorityScore: 1,
    });
    mockReadyPile([...clog, fresh]);
    mockIndexedSends.mockResolvedValue(new Set<string>());
    mockIdempotentJobs.mockImplementation(async (emails: string[]) => {
      const map = new Map<string, { status: 'accepted' }>();
      for (const email of emails) {
        if (email !== 'crime@unsent.co.uk') {
          map.set(email, { status: 'accepted' });
        }
      }
      return map;
    });

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 10,
      sentLimit: 10,
    });

    expect(mockIdempotentJobs).toHaveBeenCalled();
    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_unsent']);
    expect(result.skippedIdempotentJob).toBe(30);
    expect(result.skippedIndexedSend).toBe(0);
    expect(result.readyEligible).toBe(1);
    expect(result.staleReadyToReconcile[0]?.reason).toBe('accepted');
  });

  it('walks past a job-only prefix larger than the old 1200 scan ceiling', async () => {
    // The old readyProspectScanLimit(1200)===1200 ceiling meant unlimited
    // batch loaded exactly 1200 campaign matches and never saw the tail.
    const clog = Array.from({ length: 1300 }, (_, i) =>
      prospect({
        id: `fop_deep_${i}`,
        email: `deep${i}@clog.co.uk`,
        firmName: `Deep Clog ${i}`,
        priorityScore: 80,
      }),
    );
    const fresh = prospect({
      id: 'fop_tail',
      email: 'crime@tail.co.uk',
      firmName: 'Tail Firm',
      priorityScore: 1,
    });
    mockReadyPile([...clog, fresh]);
    mockIdempotentJobs.mockImplementation(async (emails: string[]) => {
      const map = new Map<string, { status: 'delivered' }>();
      for (const email of emails) {
        if (email !== 'crime@tail.co.uk') map.set(email, { status: 'delivered' });
      }
      return map;
    });

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 5,
      sentLimit: 5,
    });

    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_tail']);
    expect(result.skippedIdempotentJob).toBe(1300);
    expect(result.readyScanned).toBe(1301);
    expect(result.readyEligible).toBe(1);
  });

  it('live shape: ~2900 ready with hundreds of terminal jobs still yields a later unsent firm', async () => {
    // Mon 24 Aug production: ready≈2924, ticks attempted≈26 all idempotent_exists.
    // Selection must cheaply filter the clogged prefix (not enqueue-skip one-by-one)
    // and still surface a never-mailed firm without exhausting the tick budget.
    const clog = Array.from({ length: 800 }, (_, i) =>
      prospect({
        id: `fop_live_${i}`,
        email: `live${i}@clog.co.uk`,
        firmName: `Live Clog ${i}`,
        priorityScore: 90,
      }),
    );
    const filler = Array.from({ length: 2100 }, (_, i) =>
      prospect({
        id: `fop_fill_${i}`,
        email: `fill${i}@ready.co.uk`,
        firmName: `Filler ${i}`,
        priorityScore: 10,
      }),
    );
    const unsent = prospect({
      id: 'fop_live_unsent',
      email: 'crime@live-unsent.co.uk',
      firmName: 'Live Unsent',
      priorityScore: 1,
    });
    // Clog prefix, then filler that is also jobbed, unsent near the end.
    mockReadyPile([...clog, ...filler, unsent]);
    mockIdempotentJobs.mockImplementation(async (emails: string[]) => {
      const map = new Map<string, { status: 'accepted' }>();
      for (const email of emails) {
        if (email !== 'crime@live-unsent.co.uk') map.set(email, { status: 'accepted' });
      }
      return map;
    });

    const started = Date.now();
    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 40,
      sentLimit: 20,
    });
    const elapsedMs = Date.now() - started;

    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_live_unsent']);
    expect(result.skippedIdempotentJob).toBe(2900);
    expect(result.readyEligible).toBe(1);
    expect(result.staleReadyToReconcile.length).toBeGreaterThan(0);
    // Must not resemble the live 100s enqueue-skip burn; selection is in-memory mocks.
    expect(elapsedMs).toBeLessThan(5_000);
    // Job lookup is batched per walk chunk — not one enqueue round-trip per clog row.
    expect(mockIdempotentJobs.mock.calls.length).toBeGreaterThan(1);
    expect(mockIdempotentJobs.mock.calls.length).toBeLessThan(50);
  });

  it('does not treat PSA terminal-job history as RepUK idempotent (campaign-scoped)', async () => {
    const sharedInbox = prospect({
      id: 'fop_repuk',
      email: 'info@shared.co.uk',
      priorityScore: 50,
    });
    mockReadyPile([sharedInbox]);
    // PSA may have mailed this inbox; campaign-scoped job lookup returns empty for RepUK.
    mockIdempotentJobs.mockResolvedValue(new Map());
    mockIndexedSends.mockResolvedValue(new Set<string>());

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 50,
      sentLimit: 50,
    });

    expect(mockIdempotentJobs).toHaveBeenCalledWith(
      ['info@shared.co.uk'],
      'whatsapp_invite_v1',
      0,
    );
    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_repuk']);
    expect(result.skippedIdempotentJob).toBe(0);
  });

  it('honours deadlineMs so a clogged ready walk cannot eat the send window', async () => {
    const clog = Array.from({ length: 500 }, (_, i) =>
      prospect({
        id: `fop_slow_${i}`,
        email: `slow${i}@clog.co.uk`,
        priorityScore: 80,
      }),
    );
    const fresh = prospect({
      id: 'fop_after_deadline',
      email: 'crime@after.co.uk',
      priorityScore: 1,
    });
    mockReadyPile([...clog, fresh]);
    mockIdempotentJobs.mockImplementation(async (emails: string[]) => {
      await new Promise((r) => setTimeout(r, 30));
      const map = new Map<string, { status: 'accepted' }>();
      for (const email of emails) {
        if (email !== 'crime@after.co.uk') map.set(email, { status: 'accepted' });
      }
      return map;
    });

    const deadlineMs = Date.now() + 80;
    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 40,
      sentLimit: 10,
      deadlineMs,
    });

    expect(result.selectionTimedOut).toBe(true);
    // Stopped early — must not have walked the entire 500+ clog for readyLimit 40.
    expect(result.readyScanned).toBeLessThan(500);
  });

  it('readyProspectScanLimit is a status hint, not a send-path hard ceiling of 1200', () => {
    // Locking readyProspectScanLimit(1200)===1200 was the bug: unlimited
    // batch set readyLimit=1200 and overscan collapsed to zero.
    expect(readyProspectScanLimit(200)).toBe(1200);
    expect(readyProspectScanLimit(1200)).toBe(7200);
    expect(readyProspectScanLimit(50)).toBe(300);
  });

  it('honours maxReadyScan and skipIndexedSendCheck for status probes', async () => {
    const many = Array.from({ length: 200 }, (_, i) =>
      prospect({ id: `fop_${i}`, email: `a${i}@firm.co.uk` }),
    );
    mockReadyPile(many);
    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 40,
      sentLimit: 20,
      maxReadyScan: 120,
      skipIndexedSendCheck: true,
      excludeFirmCooldown: false,
    });
    expect(mockIndexedSends).not.toHaveBeenCalled();
    expect(mockIdempotentJobs).not.toHaveBeenCalled();
    // May stop once readyLimit is filled; must not exceed maxReadyScan.
    expect(result.readyScanned).toBeLessThanOrEqual(120);
    expect(result.readyEligible).toBe(40);
    expect(result.skippedIndexedSend).toBe(0);
    expect(result.skippedIdempotentJob).toBe(0);
  });

  it('scopes indexed-send skips to the campaign being flushed', async () => {
    const fresh = prospect({ id: 'fop_fresh', email: 'duty@fresh.co.uk' });
    mockReadyPile([fresh]);
    mockIndexedSends.mockResolvedValue(new Set<string>());

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 50,
      sentLimit: 50,
    });

    expect(mockIndexedSends).toHaveBeenCalledWith(
      ['duty@fresh.co.uk'],
      'whatsapp_invite_v1',
    );
    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_fresh']);
  });

  it('excludes follow-ups whose due step already has a terminal job (zombie sequenceStep)', async () => {
    // Live Aug 26: followUpEligible=16 / wouldSend=0 — step-1 jobs existed while
    // prospect.sequenceStep stayed 0. Selection must not count them as sendable.
    const zombie = prospect({
      id: 'fop_zombie_fu',
      status: 'sent',
      sequenceStep: 0,
      lastEmailAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
      email: 'crime@zombie.co.uk',
      firmName: 'Zombie Firm',
    });
    const realFu = prospect({
      id: 'fop_real_fu',
      status: 'sent',
      sequenceStep: 0,
      lastEmailAt: new Date(Date.now() - 9 * 86_400_000).toISOString(),
      email: 'crime@realfu.co.uk',
      firmName: 'Real Followup',
    });
    mockReadyPile([], [zombie, realFu]);
    mockIdempotentJobs.mockImplementation(
      async (emails: string[], _campaign: string, step = 0) => {
        const map = new Map<string, { status: 'accepted'; acceptedAt: string }>();
        if (step === 1) {
          for (const email of emails) {
            if (email === 'crime@zombie.co.uk') {
              map.set(email, {
                status: 'accepted',
                acceptedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
              });
            }
          }
        }
        return map;
      },
    );

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 10,
      sentLimit: 50,
    });

    expect(result.followUpEligible).toBe(1);
    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_real_fu']);
    expect(result.candidates[0]?.step).toBe(1);
    expect(result.skippedIdempotentJob).toBe(1);
    expect(result.staleFollowUpsToReconcile).toHaveLength(1);
    expect(result.staleFollowUpsToReconcile[0]?.advanceToStep).toBe(1);
    expect(result.staleFollowUpsToReconcile[0]?.prospect.id).toBe('fop_zombie_fu');
    expect(mockIdempotentJobs).toHaveBeenCalledWith(
      expect.arrayContaining(['crime@zombie.co.uk', 'crime@realfu.co.uk']),
      'whatsapp_invite_v1',
      1,
    );
  });
});
