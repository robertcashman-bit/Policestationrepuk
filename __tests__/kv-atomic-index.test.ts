import { beforeEach, describe, expect, it, vi } from 'vitest';

type StoreValue =
  | { kind: 'set'; members: Set<string> }
  | { kind: 'json'; value: string[] };

const state = vi.hoisted(() => ({
  store: new Map<string, StoreValue>(),
  delImpl: 'fn' as 'fn' | 'missing',
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
    get: async (key: string) => {
      const entry = state.store.get(key);
      if (!entry) return null;
      if (entry.kind === 'set') throw wrongType();
      return entry.value;
    },
    set: async () => 'OK',
    get del() {
      if (state.delImpl === 'missing') return undefined;
      return async (key: string) => {
        state.store.delete(key);
        return 1;
      };
    },
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

import { addToIndexSet, readIndexMembers } from '@/lib/kv-atomic';

describe('kv-atomic index WRONGTYPE hardening', () => {
  beforeEach(() => {
    state.store.clear();
    state.delImpl = 'fn';
  });

  it('reads non-empty Redis SET members', async () => {
    state.store.set('idx', { kind: 'set', members: new Set(['a', 'b']) });
    await expect(readIndexMembers('idx')).resolves.toEqual(expect.arrayContaining(['a', 'b']));
  });

  it('returns [] for empty Redis SET without throwing WRONGTYPE', async () => {
    state.store.set('idx', { kind: 'set', members: new Set() });
    await expect(readIndexMembers('idx')).resolves.toEqual([]);
  });

  it('migrates legacy JSON array to SET', async () => {
    state.store.set('idx', { kind: 'json', value: ['x', 'y'] });
    await expect(readIndexMembers('idx')).resolves.toEqual(['x', 'y']);
    const after = state.store.get('idx');
    expect(after?.kind).toBe('set');
    if (after?.kind === 'set') {
      expect([...after.members].sort()).toEqual(['x', 'y']);
    }
  });

  it('returns legacy JSON when del is unavailable (no throw)', async () => {
    state.delImpl = 'missing';
    state.store.set('idx', { kind: 'json', value: ['only'] });
    await expect(readIndexMembers('idx')).resolves.toEqual(['only']);
    expect(state.store.get('idx')?.kind).toBe('json');
  });

  it('addToIndexSet migrates JSON then adds id', async () => {
    state.store.set('idx', { kind: 'json', value: ['a'] });
    await addToIndexSet('idx', 'b');
    const after = state.store.get('idx');
    expect(after?.kind).toBe('set');
    if (after?.kind === 'set') {
      expect([...after.members].sort()).toEqual(['a', 'b']);
    }
  });

  it('addToIndexSet succeeds when key is already a SET', async () => {
    state.store.set('idx', { kind: 'set', members: new Set(['a']) });
    await addToIndexSet('idx', 'b');
    const after = state.store.get('idx');
    expect(after?.kind).toBe('set');
    if (after?.kind === 'set') {
      expect([...after.members].sort()).toEqual(['a', 'b']);
    }
  });

  /**
   * Lead engine #88: production indexes are Redis SETs. Legacy readers called
   * kv.get (WRONGTYPE). readIndexMembers must return SET members instead.
   */
  it('Lead engine #88: firmprospect:index SET is readable when get throws WRONGTYPE', async () => {
    const key = 'firmprospect:index';
    state.store.set(key, {
      kind: 'set',
      members: new Set(['fp_alpha', 'fp_beta']),
    });
    // Direct get must throw (bit-fork legacy path).
    await expect(
      (async () => {
        const entry = state.store.get(key);
        if (entry?.kind === 'set') throw wrongType();
        return entry;
      })(),
    ).rejects.toThrow(/WRONGTYPE/);

    const ids = await readIndexMembers(key);
    expect(ids.sort()).toEqual(['fp_alpha', 'fp_beta']);
  });
});
