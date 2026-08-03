import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  forceClear: vi.fn(async () => true),
  pipeline: vi.fn(),
}));

vi.mock('@/lib/cron-auth', () => ({
  isOutreachBootstrapAuthorized: () => true,
}));

vi.mock('@robertcashman/firm-outreach-core', () => ({
  validateOutreachEnv: () => ({ ok: true, warnings: [], errors: [] }),
}));

vi.mock('@/lib/firm-outreach/constants', () => ({
  cronSendBatchSize: () => 25,
  outreachRequireApproval: () => false,
}));

vi.mock('@/lib/firm-outreach/run-lock', () => ({
  forceClearOutreachRunLock: mocks.forceClear,
}));

vi.mock('@/lib/firm-outreach/run-pipeline', () => ({
  runFirmOutreachPipeline: mocks.pipeline,
}));

import { GET } from '@/app/api/cron/firm-outreach-send/route';

describe('firm-outreach-send lock clearing', () => {
  beforeEach(() => {
    mocks.forceClear.mockClear();
    mocks.pipeline.mockReset();
  });

  it('does not steal a live lock on normal cron overlap', async () => {
    mocks.pipeline.mockResolvedValue({
      skipped: false,
      send: {
        skippedReason: 'overlap',
        sent: 0,
        queued: 0,
        skipped: 0,
        suppressed: 0,
        errors: 0,
        elapsedMs: 10,
      },
      laa: { refreshed: false, source: 'none', count: 0 },
      dscc: { count: 0, syncedAt: null },
      discovery: {},
      requalify: {},
      enrich: {},
      counts: {},
      elapsedMs: 10,
    });

    const res = await GET(new Request('https://example.com/api/cron/firm-outreach-send?limit=10'));
    const body = await res.json();
    expect(mocks.forceClear).not.toHaveBeenCalled();
    expect(mocks.pipeline).toHaveBeenCalledTimes(1);
    expect(body.send.skippedReason).toBe('overlap');
    expect(body.retriedAfterOverlap).toBeUndefined();
  });

  it('force=1 clears lock before the first pipeline run', async () => {
    mocks.pipeline.mockResolvedValue({
      skipped: false,
      send: { sent: 1, queued: 1, skipped: 0, suppressed: 0, errors: 0, elapsedMs: 50 },
      laa: { refreshed: false, source: 'none', count: 0 },
      dscc: { count: 0, syncedAt: null },
      discovery: {},
      requalify: {},
      enrich: {},
      counts: {},
      elapsedMs: 50,
    });

    const res = await GET(
      new Request('https://example.com/api/cron/firm-outreach-send?limit=10&force=1'),
    );
    const body = await res.json();
    expect(mocks.forceClear).toHaveBeenCalledWith('send');
    expect(mocks.pipeline).toHaveBeenCalledTimes(1);
    expect(body.forceClearedLock).toBe(true);
  });
});
