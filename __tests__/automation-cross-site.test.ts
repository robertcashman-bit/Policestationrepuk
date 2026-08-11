import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/buffer/verify-cross-site', () => ({
  verifyCrossSiteBufferPosts: vi.fn(),
}));

vi.mock('@/lib/buffer/engine-run', () => ({
  verifyRepukBufferSchedule: vi.fn(async () => ({
    ok: true,
    date: '2026-07-19',
    scheduledCount: 5,
    requiredCount: 5,
    gapFilled: 1,
    issues: [],
  })),
}));

vi.mock('@/lib/automation/repairs/sibling-fallback', () => ({
  scheduleSiblingFallbackFromRepuk: vi.fn(async () => ({
    attempted: true,
    verified: true,
    scheduled: 5,
    needed: 5,
    summary: 'custodynote.com: REPUK fallback scheduled 5/5',
    dryRun: false,
  })),
  siblingFallbackPromos: vi.fn(() => [{ slug: 'home' }]),
}));

import { verifyCrossSiteBufferPosts } from '@/lib/buffer/verify-cross-site';
import { inspectAndRepairCrossSiteQuota } from '@/lib/automation/repairs/cross-site';
import { scheduleSiblingFallbackFromRepuk } from '@/lib/automation/repairs/sibling-fallback';

describe('cross-site quota repair policy', () => {
  beforeEach(() => {
    vi.stubEnv('AUTOMATION_DRY_RUN', '1');
    vi.stubEnv('AUTO_REPAIR_ENABLED', '0');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('reports deficit without inventing filler content', async () => {
    vi.mocked(verifyCrossSiteBufferPosts).mockResolvedValue({
      ok: false,
      date: '2026-07-18',
      sites: [
        {
          id: 'policestationrepuk',
          hostname: 'policestationrepuk.org',
          sentCount: 3,
          requiredCount: 5,
          ok: false,
          issue: 'only 3/5',
        },
        {
          id: 'psrtrain',
          hostname: 'psrtrain.com',
          sentCount: 2,
          requiredCount: 5,
          ok: false,
          issue: 'only 2/5',
        },
      ],
      problems: [],
    });

    const fetchMock = vi.fn(async () => new Response('unauthorized', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await inspectAndRepairCrossSiteQuota({ dryRun: true, date: '2026-07-18' });
    expect(result.expected).toBe(20);
    expect(result.actual).toBe(5);
    expect(result.issues.some((i) => i.summary.includes('psrtrain'))).toBe(true);
    expect(
      result.issues.find((i) => i.summary.includes('psrtrain'))?.requiresHumanAction,
    ).toBe(true);
    expect(result.issues.find((i) => i.summary.includes('psrtrain'))?.category).toBe(
      'quota_supply',
    );
    expect(result.repairs.some((r) => r.kind === 'crosssite_repuk_gap_fill')).toBe(true);
    expect(result.repairs.some((r) => r.kind === 'crosssite_sibling_remote_schedule')).toBe(
      true,
    );
  });

  it('does not flood REPUK multi-feed for sibling deficits', async () => {
    vi.mocked(verifyCrossSiteBufferPosts).mockResolvedValue({
      ok: false,
      date: '2026-07-18',
      sites: [
        {
          id: 'custodynote',
          hostname: 'custodynote.com',
          sentCount: 0,
          requiredCount: 5,
          ok: false,
        },
      ],
      problems: [],
    });
    const fetchMock = vi.fn(async () => new Response('not found', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await inspectAndRepairCrossSiteQuota({ dryRun: true });
    expect(
      result.repairs.every(
        (r) => r.kind !== 'crosssite_repuk_gap_fill' || r.target === 'policestationrepuk',
      ),
    ).toBe(true);
    expect(result.issues[0]?.requiresHumanAction).toBe(true);
    expect(result.repairs[0]?.kind).toBe('crosssite_sibling_repuk_fallback');
  });

  it('marks sibling deficit recoverable when remote schedule succeeds', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('AUTOMATION_DRY_RUN', '0');
    vi.stubEnv('AUTO_REPAIR_ENABLED', '1');
    vi.stubEnv('CROSS_SITE_REMOTE_REPAIR_ENABLED', '1');
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    vi.stubEnv('VERCEL_ENV', 'production');

    vi.mocked(verifyCrossSiteBufferPosts).mockResolvedValue({
      ok: false,
      date: '2026-08-02',
      sites: [
        {
          id: 'psrtrain',
          hostname: 'psrtrain.com',
          sentCount: 3,
          requiredCount: 5,
          ok: false,
          issue: 'only 3/5',
        },
      ],
      problems: [],
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/buffer/schedule')) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url.includes('/api/buffer/verify')) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await inspectAndRepairCrossSiteQuota({
      dryRun: false,
      forceRemoteRepair: true,
    });
    expect(fetchMock).toHaveBeenCalled();
    expect(result.repairs[0]?.kind).toBe('crosssite_sibling_remote_schedule');
    expect(result.repairs[0]?.verified).toBe(true);
    expect(result.issues[0]?.requiresHumanAction).toBe(false);
    expect(result.issues[0]?.severity).toBe('warning');
  });

  it('uses REPUK fallback when sibling schedule endpoint is missing', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('AUTOMATION_DRY_RUN', '0');
    vi.stubEnv('CROSS_SITE_REMOTE_REPAIR_ENABLED', '1');
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    vi.stubEnv('VERCEL_ENV', 'production');

    vi.mocked(verifyCrossSiteBufferPosts).mockResolvedValue({
      ok: false,
      date: '2026-08-10',
      sites: [
        {
          id: 'custodynote',
          hostname: 'custodynote.com',
          sentCount: 2,
          requiredCount: 5,
          ok: false,
          issue: 'only 2/5',
        },
      ],
      problems: [],
    });

    const fetchMock = vi.fn(async () => new Response('not found', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await inspectAndRepairCrossSiteQuota({
      dryRun: false,
      forceRemoteRepair: true,
    });
    expect(scheduleSiblingFallbackFromRepuk).toHaveBeenCalled();
    expect(result.repairs[0]?.kind).toBe('crosssite_sibling_repuk_fallback');
    expect(result.repairs[0]?.verified).toBe(true);
    expect(result.issues[0]?.requiresHumanAction).toBe(false);
  });
});
