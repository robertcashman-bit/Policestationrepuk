import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, unknown>();
const sets = new Map<string, Set<string>>();
let pipelineFailAfter = 0;
let pipelineExecCount = 0;

const kv = {
  async keys(pattern: string) {
    const prefix = pattern.replace(/\*$/, '');
    return [...store.keys()].filter((k) => k.startsWith(prefix));
  },
  async get<T>(key: string) {
    if (sets.has(key)) throw new Error('WRONGTYPE');
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
    const set = sets.get(key);
    if (!set) return 0;
    set.delete(member);
    return 1;
  },
  async smembers(key: string) {
    const set = sets.get(key);
    if (!set) {
      // Missing key → empty array (Upstash behaviour)
      return [];
    }
    return [...set];
  },
  async rename(from: string, to: string) {
    if (sets.has(from)) {
      sets.set(to, sets.get(from)!);
      sets.delete(from);
      store.delete(from);
      return 'OK';
    }
    if (store.has(from)) {
      store.set(to, store.get(from)!);
      store.delete(from);
      sets.delete(from);
      return 'OK';
    }
    throw new Error('ERR no such key');
  },
  pipeline() {
    const ops: Array<() => Promise<unknown>> = [];
    const p = {
      get(key: string) {
        ops.push(async () => {
          if (sets.has(key)) return null;
          return store.get(key) ?? null;
        });
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
        pipelineExecCount += 1;
        if (pipelineFailAfter > 0 && pipelineExecCount > pipelineFailAfter) {
          throw new Error('boom');
        }
        const out = [];
        for (const op of ops) out.push(await op());
        return out;
      },
    };
    return p;
  },
};

vi.mock('@/lib/kv', () => ({
  getKV: () => kv,
  skipKVInPrerender: () => false,
}));

describe('kv-prefix-index', () => {
  beforeEach(() => {
    store.clear();
    sets.clear();
    pipelineFailAfter = 0;
    pipelineExecCount = 0;
    vi.resetModules();
  });

  it('lazy-rebuilds an empty index from KEYS and excludes the index key itself', async () => {
    store.set('repreview:a@example.com', { email: 'a@example.com' });
    store.set('repreview:b@example.com', { email: 'b@example.com' });
    // Would match repreview:* — must not become a member
    sets.set('repreview:index', new Set());

    const { listIndexedIds, idFromPrefixedKey } = await import('@/lib/kv-prefix-index');
    expect(idFromPrefixedKey('repreview:index', 'repreview:')).toBeNull();
    expect(idFromPrefixedKey('repreview:index:rebuild', 'repreview:')).toBeNull();

    const ids = await listIndexedIds({
      indexKey: 'repreview:index',
      prefix: 'repreview:',
    });
    expect(ids.sort()).toEqual(['a@example.com', 'b@example.com']);
    expect(sets.get('repreview:index')?.has('a@example.com')).toBe(true);
  });

  it('preserves the live index when a staged rebuild fails mid-write', async () => {
    store.set('repreview:a@example.com', { email: 'a@example.com' });
    sets.set('repreview:index', new Set(['a@example.com']));

    // Force a multi-chunk rebuild (chunk size 200).
    for (let i = 0; i < 250; i++) {
      store.set(`repreview:extra${i}@example.com`, { email: `extra${i}@example.com` });
    }
    pipelineFailAfter = 1;

    const { rebuildPrefixIndex } = await import('@/lib/kv-prefix-index');
    await expect(
      rebuildPrefixIndex('repreview:index', 'repreview:'),
    ).rejects.toThrow(/boom/);
    expect(sets.get('repreview:index')?.has('a@example.com')).toBe(true);
    expect(sets.has('repreview:index:rebuild')).toBe(false);
  });

  it('returns existing index members without KEYS when already populated', async () => {
    sets.set('repreview:index', new Set(['cached@example.com']));
    const { listIndexedIds } = await import('@/lib/kv-prefix-index');
    const ids = await listIndexedIds({
      indexKey: 'repreview:index',
      prefix: 'repreview:',
    });
    expect(ids).toEqual(['cached@example.com']);
  });

  it('mgetByKeys returns values in key order', async () => {
    store.set('repreview:a@x.com', { email: 'a@x.com', status: 'approved' });
    store.set('repreview:b@x.com', { email: 'b@x.com', status: 'pending' });
    const { mgetByKeys } = await import('@/lib/kv-prefix-index');
    const rows = await mgetByKeys<{ email: string }>([
      'repreview:a@x.com',
      'repreview:missing',
      'repreview:b@x.com',
    ]);
    expect(rows[0]?.email).toBe('a@x.com');
    expect(rows[1]).toBeNull();
    expect(rows[2]?.email).toBe('b@x.com');
  });
});
