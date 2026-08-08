import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as fullGet } from '@/app/api/cron/firm-outreach-pipeline/full/route';
import { GET as digestGet } from '@/app/api/cron/firm-outreach-digest/route';
import { GET as sendGet } from '@/app/api/cron/firm-outreach-send/route';

const mockPipeline = vi.fn();
const mockApprovalEmail = vi.fn();
const mockWorker = vi.fn();

vi.mock('@/lib/firm-outreach/run-pipeline', () => ({
  runFirmOutreachPipeline: (...args: unknown[]) => mockPipeline(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/approval-request-email', () => ({
  sendOutreachApprovalRequestEmail: (...args: unknown[]) => mockApprovalEmail(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/run-worker', () => ({
  runOutreachWorkerTick: (...args: unknown[]) => mockWorker(...args),
}));

vi.mock('@robertcashman/firm-outreach-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@robertcashman/firm-outreach-core')>();
  return {
    ...actual,
    validateOutreachEnv: () => ({ ok: true, errors: [], warnings: [] }),
  };
});

const ENV = process.env;

describe('firm-outreach approval crons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Explicit true — default is now auto-send (false).
    process.env = { ...ENV, CRON_SECRET: 'cron-test', FIRM_OUTREACH_REQUIRE_APPROVAL: 'true' };
    mockPipeline.mockResolvedValue({ skipped: false, send: { sent: 0 } });
    mockApprovalEmail.mockResolvedValue({ sent: true, date: '2026-06-13' });
    mockWorker.mockResolvedValue({
      ok: true,
      skipped: true,
      reason: 'approval_required',
      runId: 'w1',
      accepted: 0,
      claimed: 0,
      jobsCreated: 0,
    });
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  describe('firm-outreach-pipeline/full', () => {
    it('returns 401 without cron secret', async () => {
      const res = await fullGet(new Request('http://localhost/api/cron/firm-outreach-pipeline/full'));
      expect(res.status).toBe(401);
    });

    it('sends approval email without running the heavy pipeline', async () => {
      const res = await fullGet(
        new Request('http://localhost/api/cron/firm-outreach-pipeline/full', {
          headers: { authorization: 'Bearer cron-test' },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.mode).toBe('approval-only');
      expect(mockPipeline).not.toHaveBeenCalled();
      expect(mockApprovalEmail).toHaveBeenCalledOnce();
    });

    it('passes force=1 to approval email', async () => {
      await fullGet(
        new Request('http://localhost/api/cron/firm-outreach-pipeline/full?force=1', {
          headers: { authorization: 'Bearer cron-test' },
        }),
      );
      expect(mockApprovalEmail).toHaveBeenCalledWith({ force: true });
    });
  });

  describe('firm-outreach-digest', () => {
    it('sends approval reminder when approval required', async () => {
      const res = await digestGet(
        new Request('http://localhost/api/cron/firm-outreach-digest', {
          headers: { authorization: 'Bearer cron-test' },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.mode).toBe('approval-reminder');
      expect(mockApprovalEmail).toHaveBeenCalledWith({ reminder: true });
    });
  });
});

describe('firm-outreach legacy digest cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test', FIRM_OUTREACH_REQUIRE_APPROVAL: 'false' };
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('disables routine digest when approval is off', async () => {
    const res = await digestGet(
      new Request('http://localhost/api/cron/firm-outreach-digest', {
        headers: { authorization: 'Bearer cron-test' },
      }),
    );
    const json = await res.json();
    expect(json.mode).toBe('legacy_digest_disabled');
    expect(json.skipped).toBe(true);
  });
});

describe('firm-outreach-send cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('skips send when approval is required', async () => {
    process.env = { ...ENV, CRON_SECRET: 'cron-test', FIRM_OUTREACH_REQUIRE_APPROVAL: 'true' };
    mockWorker.mockResolvedValue({
      ok: true,
      skipped: true,
      reason: 'approval_required',
      runId: 'w1',
      accepted: 0,
      claimed: 0,
      jobsCreated: 0,
    });
    const res = await sendGet(
      new Request('http://localhost/api/cron/firm-outreach-send', {
        headers: { authorization: 'Bearer cron-test' },
      }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.mode).toBe('outreach-worker');
    expect(json.skipped).toBe(true);
    expect(json.reason).toBe('approval_required');
    expect(mockWorker).toHaveBeenCalledOnce();
  });

  it('runs outreach worker when approval disabled', async () => {
    process.env = { ...ENV, CRON_SECRET: 'cron-test', FIRM_OUTREACH_REQUIRE_APPROVAL: 'false' };
    mockWorker.mockResolvedValue({
      ok: true,
      runId: 'w2',
      accepted: 2,
      claimed: 2,
      jobsCreated: 1,
    });
    const res = await sendGet(
      new Request('http://localhost/api/cron/firm-outreach-send', {
        headers: { authorization: 'Bearer cron-test' },
      }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.mode).toBe('outreach-worker');
    expect(json.accepted).toBe(2);
    expect(mockWorker).toHaveBeenCalledOnce();
  });
});
