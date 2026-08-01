import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Reproduces Lead engine automation #88:
 * Import ready_to_send.csv → buildNameIndex → listAllProspectIds →
 * readStringList on a Redis SET index key → WRONGTYPE from kv.get.
 */

type StoreValue =
  | { kind: 'set'; members: Set<string> }
  | { kind: 'json'; value: unknown };

const state = vi.hoisted(() => ({
  store: new Map<string, StoreValue>(),
}));

function wrongType(): Error {
  return new Error('WRONGTYPE Operation against a key holding the wrong kind of value');
}

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    smembers: async (key: string) => {
      const entry = state.store.get(key);
      if (!entry) return [];
      if (entry.kind !== 'set') throw wrongType();
      return [...entry.members];
    },
    sadd: async (key: string, id: string) => {
      const entry = state.store.get(key);
      if (!entry) {
        state.store.set(key, { kind: 'set', members: new Set([id]) });
        return 1;
      }
      if (entry.kind !== 'set') throw wrongType();
      entry.members.add(id);
      return 1;
    },
    srem: async (key: string, id: string) => {
      const entry = state.store.get(key);
      if (!entry) return 0;
      if (entry.kind !== 'set') throw wrongType();
      return entry.members.delete(id) ? 1 : 0;
    },
    get: async (key: string) => {
      const entry = state.store.get(key);
      if (!entry) return null;
      if (entry.kind === 'set') throw wrongType();
      return entry.value;
    },
    set: async (key: string, value: unknown) => {
      state.store.set(key, { kind: 'json', value });
      return 'OK';
    },
    del: async (key: string) => {
      state.store.delete(key);
      return 1;
    },
    incr: async () => 1,
    expire: async () => 1,
    pipeline: () => {
      const ops: Array<() => void> = [];
      return {
        sadd: (key: string, id: string) => {
          ops.push(() => {
            const entry = state.store.get(key);
            if (!entry) {
              state.store.set(key, { kind: 'set', members: new Set([id]) });
              return;
            }
            if (entry.kind !== 'set') throw wrongType();
            entry.members.add(id);
          });
        },
        exec: async () => {
          for (const op of ops) op();
          return [];
        },
      };
    },
  }),
  skipKVInPrerender: () => false,
}));

import { listAllProspectIds } from '@/lib/firm-outreach/storage';

describe('Lead engine #88 KV WRONGTYPE (listAllProspectIds)', () => {
  beforeEach(() => {
    state.store.clear();
  });

  it('does not throw when firmprospect:index is a Redis SET (get would WRONGTYPE)', async () => {
    state.store.set('firmprospect:index', {
      kind: 'set',
      members: new Set(['fp_one', 'fp_two', 'fp_three']),
    });

    // Legacy bit-fork path: kv.get on SET → WRONGTYPE (what failed in run 30687864073).
    await expect(
      (async () => {
        const entry = state.store.get('firmprospect:index');
        if (!entry) return null;
        if (entry.kind === 'set') throw wrongType();
        return entry.value;
      })(),
    ).rejects.toThrow(/WRONGTYPE/);

    await expect(listAllProspectIds()).resolves.toEqual(
      expect.arrayContaining(['fp_one', 'fp_two', 'fp_three']),
    );
  });

  it('returns [] for empty SET index without failing import name-index build', async () => {
    state.store.set('firmprospect:index', { kind: 'set', members: new Set() });
    await expect(listAllProspectIds()).resolves.toEqual([]);
  });
});
