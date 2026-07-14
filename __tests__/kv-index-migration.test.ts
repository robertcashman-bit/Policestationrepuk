import { beforeEach, describe, expect, it, vi } from 'vitest';

type StoreValue = string | string[] | Set<string>;

const store = vi.hoisted(() => new Map<string, StoreValue>());

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    smembers: async (key: string) => {
      const val = store.get(key);
      if (val instanceof Set) return [...val];
      if (val === undefined) return [];
      throw new Error('WRONGTYPE Operation against a key holding the wrong kind of value');
    },
    sadd: async (key: string, id: string) => {
      const val = store.get(key);
      if (val === undefined) {
        store.set(key, new Set([id]));
        return 1;
      }
      if (val instanceof Set) {
        val.add(id);
        return 1;
      }
      throw new Error('WRONGTYPE Operation against a key holding the wrong kind of value');
    },
    get: async <T,>(key: string): Promise<T | null> => {
      const val = store.get(key);
      if (val instanceof Set) {
        throw new Error('WRONGTYPE Operation against a key holding the wrong kind of value');
      }
      return (val as T) ?? null;
    },
    set: async (key: string, value: StoreValue) => {
      store.set(key, value);
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    pipeline: () => {
      const ops: Array<() => Promise<unknown>> = [];
      return {
        sadd: (key: string, id: string) => {
          ops.push(async () => {
            const val = store.get(key);
            if (val === undefined) {
              store.set(key, new Set([id]));
              return 1;
            }
            if (val instanceof Set) {
              val.add(id);
              return 1;
            }
            throw new Error('WRONGTYPE Operation against a key holding the wrong kind of value');
          });
        },
        exec: async () => {
          const out = [];
          for (const op of ops) out.push(await op());
          return out;
        },
      };
    },
  }),
  skipKVInPrerender: () => false,
}));

import { addToIndexSet, readIndexMembers } from '@/lib/kv-atomic';

describe('kv index migration', () => {
  beforeEach(() => {
    store.clear();
  });

  it('migrates legacy JSON array indexes to Redis SET without WRONGTYPE crash', async () => {
    store.set('custodysuite:index', ['a', 'b', 'c']);
    const members = await readIndexMembers('custodysuite:index');
    expect(members.sort()).toEqual(['a', 'b', 'c']);
    expect(store.get('custodysuite:index')).toBeInstanceOf(Set);
    await addToIndexSet('custodysuite:index', 'd');
    expect([...(store.get('custodysuite:index') as Set<string>)].sort()).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('addToIndexSet recovers when key is still a JSON array', async () => {
    store.set('custodyfinding:suite:x', ['f1']);
    await addToIndexSet('custodyfinding:suite:x', 'f2');
    const members = await readIndexMembers('custodyfinding:suite:x');
    expect(members.sort()).toEqual(['f1', 'f2']);
  });
});
