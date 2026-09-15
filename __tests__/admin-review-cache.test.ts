import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, unknown>();
const sets = new Map<string, Set<string>>();
let keysCalls = 0;

function makeKv() {
  return {
    async keys(pattern: string) {
      keysCalls += 1;
      const prefix = pattern.replace(/\*$/, '');
      return [...store.keys()].filter((k) => k.startsWith(prefix) && !sets.has(k));
    },
    async get<T>(key: string) {
      return (store.get(key) as T) ?? null;
    },
    async set(key: string, value: unknown) {
      store.set(key, value);
      return 'OK';
    },
    async del(key: string) {
      store.delete(key);
      sets.delete(key);
    },
    async sadd(key: string, member: string) {
      const set = sets.get(key) ?? new Set<string>();
      set.add(member);
      sets.set(key, set);
      return 1;
    },
    async srem(key: string, member: string) {
      sets.get(key)?.delete(member);
      return 1;
    },
    async smembers(key: string) {
      return sets.has(key) ? [...sets.get(key)!] : [];
    },
    pipeline() {
      const ops: Array<() => Promise<unknown>> = [];
      const p = {
        get(key: string) {
          ops.push(async () => store.get(key) ?? null);
          return p;
        },
        sadd(key: string, member: string) {
          ops.push(async () => {
            const set = sets.get(key) ?? new Set<string>();
            set.add(member);
            sets.set(key, set);
            return 1;
          });
          return p;
        },
        async exec() {
          const out = [];
          for (const op of ops) out.push(await op());
          return out;
        },
      };
      return p;
    },
  };
}

vi.mock('@/lib/kv', () => ({
  getKV: () => makeKv(),
  skipKVInPrerender: () => false,
}));

vi.mock('@/lib/custody-tips/reward', () => ({
  redeemPendingContributorReward: vi.fn(async () => undefined),
}));

describe('admin-review loadAllReviews cache + index', () => {
  beforeEach(() => {
    store.clear();
    sets.clear();
    keysCalls = 0;
    vi.resetModules();
  });

  it('indexes on setReview and serves cached loadAllReviews without KEYS', async () => {
    const { setReview, loadAllReviews, invalidateReviewsCache } = await import(
      '@/lib/admin-review'
    );

    await setReview('rep@example.com', { status: 'approved' }, 'admin@example.com');
    expect(sets.get('repreview:index')?.has('rep@example.com')).toBe(true);

    invalidateReviewsCache();
    keysCalls = 0;
    const first = await loadAllReviews();
    expect(first.get('rep@example.com')?.status).toBe('approved');
    // Index hit — no KEYS needed when index already has members
    expect(keysCalls).toBe(0);

    const second = await loadAllReviews();
    expect(second).toBe(first); // same in-memory map within TTL
  });

  it('deleteReview removes index membership and busts cache', async () => {
    const { setReview, deleteReview, loadAllReviews, invalidateReviewsCache } = await import(
      '@/lib/admin-review'
    );
    await setReview('gone@example.com', { status: 'pending' }, 'admin@example.com');
    await deleteReview('gone@example.com');
    expect(sets.get('repreview:index')?.has('gone@example.com')).toBe(false);
    invalidateReviewsCache();
    const map = await loadAllReviews();
    expect(map.has('gone@example.com')).toBe(false);
  });

  it('lazy-rebuilds review index from KEYS when empty', async () => {
    store.set('repreview:legacy@example.com', {
      email: 'legacy@example.com',
      status: 'approved',
      adminNotes: '',
      lastReviewedAt: new Date().toISOString(),
      reviewedBy: 'admin',
    });
    const { loadAllReviews } = await import('@/lib/admin-review');
    const map = await loadAllReviews();
    expect(map.get('legacy@example.com')?.status).toBe('approved');
    expect(sets.get('repreview:index')?.has('legacy@example.com')).toBe(true);
    expect(keysCalls).toBeGreaterThan(0);
  });
});
