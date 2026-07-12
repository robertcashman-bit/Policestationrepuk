import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  suppressed: [] as Array<{ email: string; reason: string }>,
  prospect: null as any,
  validToken: 'valid-token',
  tokenEmail: 'firm@example.com',
}));

vi.mock('@/lib/firm-outreach/outreach/unsubscribe-token', () => ({
  verifyUnsubscribeToken: (raw: string) =>
    raw === state.validToken ? { email: state.tokenEmail, exp: 9999999999 } : null,
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  addSuppression: async (email: string, reason: string) => {
    state.suppressed.push({ email, reason });
  },
  getProspectByEmail: async () => state.prospect,
  saveProspect: async (p: any) => {
    state.prospect = { ...p };
  },
}));

import { POST } from '@/app/api/outreach/unsubscribe/[token]/route';

function req() {
  return new Request('https://policestationrepuk.org/api/outreach/unsubscribe/x', {
    method: 'POST',
  });
}

describe('one-click unsubscribe (RFC 8058) POST', () => {
  beforeEach(() => {
    state.suppressed = [];
    state.prospect = { id: 'p1', email: state.tokenEmail, status: 'sent' };
  });

  it('suppresses the address and returns 200 for a valid token', async () => {
    const res = await POST(req(), { params: Promise.resolve({ token: state.validToken }) });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, unsubscribed: true });
    expect(state.suppressed).toEqual([{ email: state.tokenEmail, reason: 'unsubscribe' }]);
    expect(state.prospect.status).toBe('unsubscribed');
  });

  it('returns 400 without suppressing for an invalid/expired token', async () => {
    const res = await POST(req(), { params: Promise.resolve({ token: 'bogus' }) });
    expect(res.status).toBe(400);
    expect(state.suppressed).toHaveLength(0);
  });
});
