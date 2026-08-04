import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
let getOverride: ((key: string) => string | null) | null = null;

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    set: async (key: string, value: unknown, opts?: { nx?: boolean; ex?: number }) => {
      if (opts?.nx && store.has(key)) return null;
      store.set(key, String(value));
      return 'OK';
    },
    get: async (key: string) => {
      if (getOverride) return getOverride(key);
      return store.get(key) ?? null;
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    eval: async (_script: string, keys: string[], args: string[]) => {
      const key = keys[0];
      const expected = args[0];
      if (!key || expected == null) return 0;
      if (store.get(key) === expected) {
        store.delete(key);
        return 1;
      }
      return 0;
    },
  }),
}));

import {
  claimOutreachRunLock,
  claimProspectSend,
  forceClearOutreachRunLock,
  lockAgeMs,
  releaseOutreachRunLock,
  releaseProspectSend,
} from '@/lib/firm-outreach/run-lock';

describe('outreach run locks', () => {
  beforeEach(() => {
    store.clear();
    getOverride = null;
  });

  it('parses lock age from ISO timestamps and droid tokens', () => {
    const now = Date.UTC(2026, 7, 4, 16, 0, 0);
    expect(lockAgeMs(new Date(now - 60_000).toISOString(), now)).toBe(60_000);
    const token = `${(now - 120_000).toString(36)}_abcd`;
    expect(lockAgeMs(token, now)).toBe(120_000);
    expect(lockAgeMs('not-a-lock', now)).toBeNull();
  });

  it('recovers a stale legacy ISO lock so cron is not stuck on overlap', async () => {
    const staleIso = new Date(Date.now() - 400_000).toISOString();
    store.set('firmoutreach:lock:send', staleIso);
    const token = await claimOutreachRunLock('send');
    expect(token).toBeTruthy();
  });

  it('does not delete a fresh claim while recovering a stale lock', async () => {
    const staleIso = new Date(Date.now() - 400_000).toISOString();
    const fresh = `${Date.now().toString(36)}_fresh`;
    store.set('firmoutreach:lock:send', staleIso);

    // First get sees the stale value; a successor claims before compare-and-delete.
    let reads = 0;
    getOverride = (key: string) => {
      if (key !== 'firmoutreach:lock:send') return store.get(key) ?? null;
      reads += 1;
      if (reads === 1) {
        store.set(key, fresh);
        return staleIso;
      }
      return store.get(key) ?? null;
    };

    const token = await claimOutreachRunLock('send');
    expect(token).toBeNull();
    expect(store.get('firmoutreach:lock:send')).toBe(fresh);
  });

  it('allows only one send lock holder at a time', async () => {
    const first = await claimOutreachRunLock('send');
    const second = await claimOutreachRunLock('send');
    expect(first).toBeTruthy();
    expect(second).toBeNull();
  });

  it('releases the send lock so the next flush is not a false overlap', async () => {
    const token = await claimOutreachRunLock('send');
    expect(token).toBeTruthy();
    await releaseOutreachRunLock('send', token!);
    const again = await claimOutreachRunLock('send');
    expect(again).toBeTruthy();
  });

  it('does not release a successor lock with a stale token', async () => {
    const first = await claimOutreachRunLock('send');
    await releaseOutreachRunLock('send', first!);
    const second = await claimOutreachRunLock('send');
    await releaseOutreachRunLock('send', first!);
    expect(store.has('firmoutreach:lock:send')).toBe(true);
    await releaseOutreachRunLock('send', second!);
    expect(store.has('firmoutreach:lock:send')).toBe(false);
  });

  it('releases prospect send claims after failed attempts', async () => {
    const token = await claimProspectSend('p1');
    expect(token).toBeTruthy();
    expect(await claimProspectSend('p1')).toBeNull();
    await releaseProspectSend('p1', token!);
    expect(await claimProspectSend('p1')).toBeTruthy();
  });

  it('force-clears a stuck send lock for kick recovery', async () => {
    const token = await claimOutreachRunLock('send');
    expect(token).toBeTruthy();
    expect(await forceClearOutreachRunLock('send')).toBe(true);
    expect(await claimOutreachRunLock('send')).toBeTruthy();
  });
});
