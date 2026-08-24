import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cron/firm-outreach-status/route';
import {
  STATUS_ELIGIBILITY_MAX_READY_SCAN,
  STATUS_ELIGIBILITY_READY_LIMIT,
  STATUS_ELIGIBILITY_SENT_LIMIT,
} from '@/lib/firm-outreach/status-eligibility-bounds';

const mockSelect = vi.fn().mockResolvedValue({
  candidates: [{}, {}, {}],
  readyScanned: 10,
  sentScanned: 5,
  readyEligible: 8,
  followUpEligible: 1,
  skippedIndexedSend: 0,
  skippedIdempotentJob: 0,
  firmCooldownSkipped: 0,
  staleReadyToReconcile: [],
  readyIndexWalked: 10,
});

vi.mock('@/lib/firm-outreach/config-status', () => ({
  getOutreachConfigStatus: vi.fn().mockResolvedValue({
    kvConfigured: true,
    resendConfigured: true,
    outreachEnabled: true,
    sendAllowed: true,
    sendHealthy: true,
    sendBlockers: [],
    campaignSendHealth: [],
    requireApproval: true,
    effectivePaused: false,
  }),
}));

vi.mock('@/lib/firm-outreach/constants', () => ({
  outreachRequireApproval: () => true,
}));

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  countEmailJobsByStatus: vi.fn().mockResolvedValue({
    pending: 0,
    claimed: 0,
    processing: 0,
    accepted: 2,
    retry_scheduled: 0,
    permanently_failed: 0,
  }),
}));

vi.mock('@/lib/firm-outreach/outreach/candidate-selection', () => ({
  selectOutreachCandidates: (...args: unknown[]) => mockSelect(...args),
}));

vi.mock('@/lib/firm-outreach/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-outreach/storage')>();
  return {
    ...actual,
    listProspectIdsByStatus: vi.fn().mockResolvedValue(Array.from({ length: 3076 }, (_, i) => `p${i}`)),
    getDailySendCount: vi.fn().mockResolvedValue(3),
    getLatestOutreachRunLog: vi.fn().mockResolvedValue(null),
  };
});

vi.mock('@robertcashman/firm-outreach-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@robertcashman/firm-outreach-core')>();
  return {
    ...actual,
    validateOutreachEnv: () => ({
      ok: true,
      errors: [],
      warnings: [],
      dryRun: false,
      sendingEnabled: true,
    }),
  };
});

const ENV = process.env;

describe('firm-outreach-status cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue({
      candidates: [{}, {}, {}],
      readyScanned: 10,
      sentScanned: 5,
      readyEligible: 8,
      followUpEligible: 1,
      skippedIndexedSend: 0,
      skippedIdempotentJob: 0,
      firmCooldownSkipped: 0,
      staleReadyToReconcile: [],
      readyIndexWalked: 10,
    });
    process.env = {
      ...ENV,
      CRON_SECRET: 'cron-test-secret',
      RESEND_API_KEY: 're_test',
      KV_REST_API_URL: 'http://localhost',
      KV_REST_API_TOKEN: 'token',
    };
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('returns 401 without cron secret', async () => {
    const res = await GET(new Request('http://localhost/api/cron/firm-outreach-status'));
    expect(res.status).toBe(401);
  });

  it('returns config and queue summary when authorized', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/firm-outreach-status', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.config.requireApproval).toBe(true);
    expect(json.queue.readyToSend).toBe(3076);
    expect(json.queue.sentToday).toBe(3);
    expect(json.queue.sendableReady).toBeGreaterThan(0);
  });

  it('keeps eligibility scans bounded so a large ready pile cannot 504', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/firm-outreach-status', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);

    // Only RepUK is scanned — PSA permanently disabled must not walk the ready index.
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: 'whatsapp_invite_v1',
        readyLimit: STATUS_ELIGIBILITY_READY_LIMIT,
        sentLimit: STATUS_ELIGIBILITY_SENT_LIMIT,
        maxReadyScan: STATUS_ELIGIBILITY_MAX_READY_SCAN,
        excludeFirmCooldown: false,
        skipIndexedSendCheck: true,
      }),
    );
    expect(STATUS_ELIGIBILITY_MAX_READY_SCAN).toBeLessThanOrEqual(200);
    expect(STATUS_ELIGIBILITY_READY_LIMIT).toBeLessThanOrEqual(50);

    const json = await res.json();
    expect(json.queue.eligibility.agent_cover_kent_v1.readyScanned).toBe(0);
    expect(json.queue.eligibility.agent_cover_kent_v1.readyEligible).toBe(0);
    expect(json.queue.eligibility.whatsapp_invite_v1.readyEligible).toBe(8);
  });

  it('accepts outreach bootstrap secret header', async () => {
    process.env = {
      ...ENV,
      CRON_SECRET: 'cron-test-secret',
      FIRM_OUTREACH_BOOTSTRAP_SECRET: 'boot-test-secret',
    };
    const res = await GET(
      new Request('http://localhost/api/cron/firm-outreach-status', {
        headers: { 'x-firm-outreach-bootstrap-secret': 'boot-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
  });
});
