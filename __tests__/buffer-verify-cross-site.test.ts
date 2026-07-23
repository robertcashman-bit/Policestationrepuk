import { describe, expect, it, vi, beforeEach } from 'vitest';
import { countSiteSentPosts } from '@/lib/buffer/verify-cross-site';

vi.mock('@robertcashman/buffer-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@robertcashman/buffer-engine')>();
  return {
    ...actual,
    listPostsInWindow: vi.fn(),
  };
});

vi.mock('@/lib/buffer/config', () => ({
  getBufferApiKey: () => 'test-key',
  getBufferOrganizationId: () => 'org',
  getSchedulerTimezone: () => 'Europe/London',
}));

vi.mock('@/lib/buffer/scheduler-storage', () => ({
  getSchedulerRunForDate: vi.fn(async () => ({
    feedIds: ['policestationrepuk', 'policestationrepuk', 'policestationrepuk'],
  })),
}));

describe('countSiteSentPosts', () => {
  const posts = [
    { text: 'Read https://policestationrepuk.org/Blog/foo on our site' },
    { text: 'Guide at https://psrtrain.com/guides/bar' },
    { text: 'Another https://policestationrepuk.org/Blog/baz' },
    { text: 'No url here' },
  ];

  it('counts posts per hostname', () => {
    expect(countSiteSentPosts(posts, 'policestationrepuk.org')).toBe(2);
    expect(countSiteSentPosts(posts, 'psrtrain.com')).toBe(1);
    expect(countSiteSentPosts(posts, 'custodynote.com')).toBe(0);
  });
});

describe('CROSS_SITE_BUFFER_TARGETS', () => {
  it('lists four sites', async () => {
    const { CROSS_SITE_BUFFER_TARGETS } = await import('@/lib/buffer/cross-site-sites');
    expect(CROSS_SITE_BUFFER_TARGETS).toHaveLength(4);
    expect(CROSS_SITE_BUFFER_TARGETS.map((s) => s.id)).toEqual([
      'policestationrepuk',
      'psrtrain',
      'custodynote',
      'policestationagent',
    ]);
  });
});

describe('verifyCrossSiteBufferPosts sibling scheduledCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses Buffer hostname counts for siblings, not REPUK KV feedIds', async () => {
    const { listPostsInWindow } = await import('@robertcashman/buffer-engine');
    const sent = [
      { text: 'A https://custodynote.com/blog/one' },
      { text: 'B https://psrtrain.com/x' },
      { text: 'C https://policestationrepuk.org/Blog/y' },
    ];
    const scheduledOrSent = [
      ...sent,
      { text: 'D https://custodynote.com/blog/two' },
      { text: 'E https://custodynote.com/blog/three' },
    ];
    vi.mocked(listPostsInWindow)
      .mockResolvedValueOnce(sent as never)
      .mockResolvedValueOnce(scheduledOrSent as never);

    const { verifyCrossSiteBufferPosts } = await import('@/lib/buffer/verify-cross-site');
    const report = await verifyCrossSiteBufferPosts({
      date: '2026-07-21',
      targets: [
        {
          id: 'custodynote',
          hostname: 'custodynote.com',
          productionUrl: 'https://custodynote.com',
          channelIds: ['ch1'],
          requiredPostsPerDay: 5,
        },
        {
          id: 'policestationrepuk',
          hostname: 'policestationrepuk.org',
          productionUrl: 'https://policestationrepuk.org',
          channelIds: ['ch2'],
          requiredPostsPerDay: 5,
        },
      ],
    });

    const cn = report.sites.find((s) => s.id === 'custodynote')!;
    expect(cn.sentCount).toBe(1);
    // 3 Buffer posts with custodynote.com — NOT 0 from REPUK KV
    expect(cn.scheduledCount).toBe(3);
    expect(cn.ok).toBe(false);
    expect(cn.issue).toContain('Buffer scheduled+sent');
    expect(cn.issue).not.toMatch(/scheduled 0\/5/);
  });
});
