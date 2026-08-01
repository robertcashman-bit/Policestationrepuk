import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, unknown>();

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    get: async <T>(key: string) => (store.get(key) as T | undefined) ?? null,
    set: async (key: string, value: unknown) => {
      store.set(key, value);
    },
    del: async (key: string) => {
      store.delete(key);
    },
    mget: async (...keys: string[]) => keys.map((k) => store.get(k) ?? null),
    sadd: async (key: string, member: string) => {
      const cur = (store.get(key) as string[] | undefined) ?? [];
      if (!cur.includes(member)) store.set(key, [...cur, member]);
      return 1;
    },
    srem: async (key: string, member: string) => {
      const cur = (store.get(key) as string[] | undefined) ?? [];
      store.set(
        key,
        cur.filter((x) => x !== member),
      );
      return 1;
    },
    smembers: async (key: string) => {
      const cur = store.get(key);
      return Array.isArray(cur) ? cur.map(String) : [];
    },
    pipeline: () => {
      const ops: Array<() => unknown> = [];
      const api = {
        get: (key: string) => {
          ops.push(() => store.get(key) ?? null);
          return api;
        },
        sadd: (key: string, member: string) => {
          ops.push(() => {
            const cur = (store.get(key) as string[] | undefined) ?? [];
            if (!cur.includes(member)) store.set(key, [...cur, member]);
          });
          return api;
        },
        exec: async () => ops.map((fn) => fn()),
      };
      return api;
    },
  }),
  skipKVInPrerender: () => false,
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      get: async (id: string) => {
        if (id === 're_delivered') {
          return { data: { id, last_event: 'delivered' }, error: null };
        }
        if (id === 're_bounced') {
          return { data: { id, last_event: 'bounced' }, error: null };
        }
        return { data: { id, last_event: 'sent' }, error: null };
      },
    };
  },
}));

describe('backfillDeliveryFromResend', () => {
  beforeEach(() => {
    store.clear();
    vi.resetModules();
    process.env.RESEND_API_KEY = 're_test';
  });

  it('applies delivered last_event onto a stuck sent row', async () => {
    const { saveSend } = await import('@/lib/firm-outreach/storage');
    const { backfillDeliveryFromResend } = await import(
      '@/lib/firm-outreach/backfill-delivery'
    );

    await saveSend({
      id: 'fos_backfill',
      prospectId: 'fop_x',
      firmName: 'Test Firm',
      prospectType: 'firm',
      email: 'info@examplefirm.co.uk',
      campaignId: 'whatsapp_invite_v1',
      sequenceStep: 0,
      subject: 'hello',
      status: 'sent',
      resendMessageId: 're_delivered',
      createdAt: '2026-08-01T10:00:00.000Z',
      sentAt: '2026-08-01T10:00:00.000Z',
    });

    const result = await backfillDeliveryFromResend({ limit: 10 });
    expect(result.applied).toBeGreaterThanOrEqual(1);

    const { getSend } = await import('@/lib/firm-outreach/storage');
    const updated = await getSend('fos_backfill');
    expect(updated?.status).toBe('delivered');
  });
});
