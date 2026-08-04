import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apply: vi.fn(),
}));

vi.mock('@/lib/firm-outreach/outreach/apply-unsubscribe', () => ({
  applyUnsubscribeToken: mocks.apply,
}));

import { GET, POST } from '@/app/api/unsubscribe/route';

describe('api/unsubscribe', () => {
  beforeEach(() => {
    mocks.apply.mockReset();
  });

  it('GET without token returns 400', async () => {
    mocks.apply.mockResolvedValue({ ok: false, error: 'missing_token' });
    const res = await GET(new Request('http://localhost/api/unsubscribe'));
    expect(res.status).toBe(400);
  });

  it('GET with valid token returns JSON confirmation', async () => {
    mocks.apply.mockResolvedValue({
      ok: true,
      email: 'a@example.co.uk',
      prospectsUpdated: 1,
    });
    const res = await GET(
      new Request('http://localhost/api/unsubscribe?token=signed.token'),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.email).toBe('a@example.co.uk');
    expect(mocks.apply).toHaveBeenCalledWith('signed.token');
  });

  it('POST applies suppression and returns empty 200 (RFC 8058)', async () => {
    mocks.apply.mockResolvedValue({
      ok: true,
      email: 'a@example.co.uk',
      prospectsUpdated: 1,
    });
    const res = await POST(
      new Request('http://localhost/api/unsubscribe?token=signed.token', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('');
    expect(mocks.apply).toHaveBeenCalledWith('signed.token');
  });

  it('POST with invalid token returns 400 without redirect', async () => {
    mocks.apply.mockResolvedValue({ ok: false, error: 'invalid_token' });
    const res = await POST(
      new Request('http://localhost/api/unsubscribe?token=bad', { method: 'POST' }),
    );
    expect(res.status).toBe(400);
    expect(res.headers.get('location')).toBeNull();
  });
});
