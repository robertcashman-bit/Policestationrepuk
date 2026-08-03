import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    set: async (key: string, value: unknown, opts?: { nx?: boolean; ex?: number }) => {
      if (opts?.nx && store.has(key)) return null;
      store.set(key, String(value));
      return 'OK';
    },
    get: async (key: string) => store.get(key) ?? null,
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
  }),
}));

import {
  claimOutreachRunLock,
  claimProspectSend,
  releaseOutreachRunLock,
  releaseProspectSend,
} from '@/lib/firm-outreach/run-lock';

describe('outreach run locks', () => {
  beforeEach(() => {
    store.clear();
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
});
