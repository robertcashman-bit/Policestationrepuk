import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as fullGet } from '@/app/api/cron/firm-outreach-pipeline/full/route';
import { GET as digestGet } from '@/app/api/cron/firm-outreach-digest/route';
import { GET as sendGet } from '@/app/api/cron/firm-outreach-send/route';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

const mockPipeline = vi.fn();

vi.mock('@/lib/firm-outreach/run-pipeline', () => ({
  runFirmOutreachPipeline: (...args: unknown[]) => mockPipeline(...args),
}));

const ENV = process.env;

describe('firm-outreach crons permanently disabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test', FIRM_OUTREACH_REQUIRE_APPROVAL: 'true' };
    mockPipeline.mockResolvedValue({ skipped: false, send: { sent: 0 } });
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  describe('firm-outreach-pipeline/full', () => {
    it('returns 401 without cron secret', async () => {
      const res = await fullGet(new Request('http://localhost/api/cron/firm-outreach-pipeline/full'));
      expect(res.status).toBe(401);
    });

    it('runs inventory-only pipeline and never approval/send', async () => {
      const res = await fullGet(
        new Request('http://localhost/api/cron/firm-outreach-pipeline/full', {
          headers: { authorization: 'Bearer cron-test' },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.mode).toBe('inventory_only_send_disabled');
      expect(json.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
      expect(mockPipeline).toHaveBeenCalledWith(
        expect.objectContaining({
          skipSend: true,
          skipDigest: true,
        }),
      );
    });
  });

  describe('firm-outreach-digest', () => {
    it('skips permanently without approval reminder', async () => {
      const res = await digestGet(
        new Request('http://localhost/api/cron/firm-outreach-digest', {
          headers: { authorization: 'Bearer cron-test' },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.mode).toBe('permanently_disabled');
      expect(json.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    });
  });
});

describe('firm-outreach-send cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test' };
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('returns permanently disabled with accepted=0', async () => {
    const res = await sendGet(
      new Request('http://localhost/api/cron/firm-outreach-send', {
        headers: { authorization: 'Bearer cron-test' },
      }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.mode).toBe('permanently_disabled');
    expect(json.skipped).toBe(true);
    expect(json.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(json.accepted).toBe(0);
  });
});
