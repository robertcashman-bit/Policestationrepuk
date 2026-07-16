import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Integration test for the send loop's cap/batch semantics and the restart-safe send lock.
 * Regression guard for: a per-run batch limit was previously treated as the whole-day
 * ceiling, so only one batch/day was ever sent regardless of the configured daily cap.
 */

const state = vi.hoisted(() => ({
  prospects: new Map<string, any>(),
  dailyCounter: 0,
  claimResult: true,
  sends: [] as string[],
}));

vi.mock('@/lib/kv', () => ({
  getKV: () => ({}), // truthy → send lock path is exercised
  skipKVInPrerender: () => false,
}));

vi.mock('@/lib/kv-atomic', () => ({
  claimKey: vi.fn(async () => state.claimResult),
  releaseKey: vi.fn(async () => undefined),
}));

vi.mock('@/lib/firm-outreach/constants', () => ({
  outreachSendEnabled: () => true,
  dailySendCap: () => 45,
}));

vi.mock('@/lib/firm-outreach/campaign-scope', () => ({
  activeOutreachCampaignId: () => 'test_campaign',
  isCampaignProspect: () => true,
}));

vi.mock('@/lib/firm-outreach/enrichment/scorer', () => ({
  sortProspectsForSend: (list: any[]) => list,
}));

vi.mock('@/lib/firm-outreach/enrichment/validator', () => ({
  isPlausibleOutreachEmail: () => true,
  validateEmailForSend: async () => ({ ok: true }),
}));

vi.mock('@/lib/firm-outreach/qualification', () => ({
  qualifyProspectForOutreach: () => ({ qualified: true, reason: 'test' }),
  resolveStatusWithQualification: () => 'ready_to_send',
}));

vi.mock('@/lib/firm-outreach/outreach/send', () => ({
  sendOutreachEmail: vi.fn(async ({ prospect }: { prospect: any }) => {
    state.sends.push(prospect.id);
    return { ok: true, messageId: `m_${prospect.id}`, subject: 'Test' };
  }),
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getDailySendCount: async () => state.dailyCounter,
  incrementDailySendCount: async () => ++state.dailyCounter,
  getGlobalResendQuotaRemaining: async () => 999,
  incrementResendSendCount: async () => 1,
  isSuppressed: async () => false,
  isDuplicateInitialSend: async () => false,
  listProspectsForFirmKey: async () => [],
  excludeProspectDuplicateEmail: async () => undefined,
  saveOutreachRunLog: async () => undefined,
  refreshProspectStatusSnapshotCache: async () => undefined,
  createSendRecord: (args: any) => ({ ...args, id: `s_${args.prospectId}`, status: 'queued' }),
  saveSend: async () => undefined,
  saveProspect: async (p: any) => {
    state.prospects.set(p.id, { ...p });
  },
  listProspectsByRecordStatus: async (status: string, limit: number) =>
    [...state.prospects.values()].filter((p) => p.status === status).slice(0, limit),
  listProspectIdsByStatus: async (status: string) =>
    [...state.prospects.values()].filter((p) => p.status === status).map((p) => p.id),
  getProspect: async (id: string) => state.prospects.get(id),
}));

import { runFirmOutreach } from '@/lib/firm-outreach/outreach/run-outreach';

function seedReadyProspects(n: number): void {
  state.prospects.clear();
  for (let i = 0; i < n; i++) {
    const id = `p${i}`;
    state.prospects.set(id, {
      id,
      firmKey: `firm-${i}`,
      firmName: `Firm ${i}`,
      prospectType: 'firm',
      status: 'ready_to_send',
      sequenceStep: 0,
      campaignId: 'test_campaign',
      email: `contact${i}@firm${i}.example`,
      sources: [],
      priorityScore: 10,
      enrichAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

beforeEach(() => {
  state.dailyCounter = 0;
  state.claimResult = true;
  state.sends = [];
  vi.clearAllMocks();
});

describe('runFirmOutreach batch vs daily cap', () => {
  it('accumulates toward the daily cap across multiple ticks (batch is per-run, not per-day)', async () => {
    seedReadyProspects(100);

    // Tick 1: batch limit 25, cap 45, nothing sent yet → sends a full batch of 25.
    const r1 = await runFirmOutreach({ limit: 25 });
    expect(r1.sent).toBe(25);
    expect(state.dailyCounter).toBe(25);

    // Tick 2: batch limit 25, but only 45-25=20 of the daily cap remain → sends 20, not 25.
    const r2 = await runFirmOutreach({ limit: 25 });
    expect(r2.sent).toBe(20);
    expect(state.dailyCounter).toBe(45);

    // Tick 3: daily cap reached → sends 0 and records the daily_cap skip.
    const r3 = await runFirmOutreach({ limit: 25 });
    expect(r3.sent).toBe(0);
    expect(r3.skipReasons?.daily_cap).toBeGreaterThan(0);

    // Total across the day equals the configured daily cap, not a single batch.
    expect(new Set(state.sends).size).toBe(45);
  });

  it('a large per-run limit never exceeds the daily cap', async () => {
    seedReadyProspects(100);
    const r = await runFirmOutreach({ limit: 1000 });
    expect(r.sent).toBe(45);
    expect(state.dailyCounter).toBe(45);
  });
});

describe('runFirmOutreach send lock', () => {
  it('skips with concurrent_run when the send lock is already held', async () => {
    seedReadyProspects(50);
    state.claimResult = false; // another run holds the lock

    const r = await runFirmOutreach({ limit: 25 });
    expect(r.sent).toBe(0);
    expect(r.skipReasons?.concurrent_run).toBe(1);
    expect(state.sends).toHaveLength(0);
    expect(state.dailyCounter).toBe(0);
  });

  it('self-heals stale-ready rows (ready_to_send with lastEmailAt) to sent during a run', async () => {
    state.prospects.clear();
    // Two stale-ready rows (already emailed, stuck at ready_to_send) + one genuinely sendable.
    state.prospects.set('stale0', {
      id: 'stale0',
      firmKey: 'f-stale0',
      firmName: 'Stale Step0',
      prospectType: 'firm',
      status: 'ready_to_send',
      sequenceStep: 0,
      lastEmailAt: new Date().toISOString(),
      campaignId: 'test_campaign',
      email: 'stale0@x.example',
      sources: [],
      priorityScore: 10,
      enrichAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    state.prospects.set('stale1', {
      id: 'stale1',
      firmKey: 'f-stale1',
      firmName: 'Stale Step1',
      prospectType: 'firm',
      status: 'ready_to_send',
      sequenceStep: 1,
      lastEmailAt: new Date().toISOString(),
      campaignId: 'test_campaign',
      email: 'stale1@x.example',
      sources: [],
      priorityScore: 10,
      enrichAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    state.prospects.set('fresh', {
      id: 'fresh',
      firmKey: 'f-fresh',
      firmName: 'Fresh',
      prospectType: 'firm',
      status: 'ready_to_send',
      sequenceStep: 0,
      campaignId: 'test_campaign',
      email: 'fresh@x.example',
      sources: [],
      priorityScore: 10,
      enrichAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const r = await runFirmOutreach({ limit: 25 });
    expect(r.sent).toBe(1); // only the fresh one sends
    expect(state.sends).toEqual(['fresh']);
    // Both stale rows are reconciled to sent (at seq 0 AND seq 1).
    expect(state.prospects.get('stale0').status).toBe('sent');
    expect(state.prospects.get('stale1').status).toBe('sent');
  });

  it('does not take the lock for dry runs (previews never block real sends)', async () => {
    seedReadyProspects(5);
    const { claimKey } = await import('@/lib/kv-atomic');
    const r = await runFirmOutreach({ limit: 25, dryRun: true });
    expect(claimKey).not.toHaveBeenCalled();
    // dry run reports would-send count without persisting
    expect(r.sent).toBe(5);
    expect(state.dailyCounter).toBe(0);
  });

  it('does not persist when provider returns ok without a message id', async () => {
    seedReadyProspects(1);
    const { sendOutreachEmail } = await import('@/lib/firm-outreach/outreach/send');
    vi.mocked(sendOutreachEmail).mockResolvedValueOnce({
      ok: true,
      subject: 'Test',
      messageId: undefined,
    });

    const r = await runFirmOutreach({ limit: 1 });
    expect(r.sent).toBe(0);
    expect(r.errors).toBe(1);
    expect(state.dailyCounter).toBe(0);
    expect(state.prospects.get('p0')?.status).toBe('ready_to_send');
  });
});
