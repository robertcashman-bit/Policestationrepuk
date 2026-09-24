import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/contact-guards', () => ({
  getClientIp: () => '1.2.3.4',
  rateLimitOk: vi.fn(async () => ({ ok: true, remaining: 4 })),
}));

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(async (token: string | null) => {
    if (!token) {
      return { ok: false, code: 'TURNSTILE_MISSING', message: 'missing' };
    }
    if (token === 'bad') {
      return { ok: false, code: 'TURNSTILE_FAILED', message: 'failed' };
    }
    return { ok: true, code: 'TURNSTILE_OK', message: 'ok' };
  }),
}));

vi.mock('@/lib/robert-direct-mobile', () => ({
  robertDirectMobilePayload: () => ({
    display: '07535 494446',
    tel: 'tel:+447535494446',
    sms: 'sms:+447535494446',
  }),
}));

import { GET, POST } from '@/app/api/rep/[slug]/direct-mobile/route';
import { rateLimitOk } from '@/lib/contact-guards';
import { verifyTurnstile } from '@/lib/turnstile';

describe('direct-mobile route', () => {
  beforeEach(() => {
    vi.mocked(rateLimitOk).mockResolvedValue({ ok: true, remaining: 4 });
    vi.mocked(verifyTurnstile).mockClear();
  });

  it('GET never returns the mobile', async () => {
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(405);
    expect(JSON.stringify(body)).not.toMatch(/07535|7535494446|\+447535/);
  });

  it('POST without token returns 403 and no mobile', async () => {
    const req = new Request('http://localhost/api/rep/robert-cashman/direct-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ slug: 'robert-cashman' }) });
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(JSON.stringify(body)).not.toMatch(/07535|7535494446|\+447535/);
  });

  it('POST with invalid turnstile returns 403 and no mobile', async () => {
    const req = new Request('http://localhost/api/rep/robert-cashman/direct-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnstileToken: 'bad' }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug: 'robert-cashman' }) });
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(JSON.stringify(body)).not.toMatch(/07535|7535494446|\+447535/);
  });

  it('POST with valid turnstile returns the mobile', async () => {
    const req = new Request('http://localhost/api/rep/robert-cashman/direct-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnstileToken: 'good-token' }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug: 'robert-cashman' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.display).toBe('07535 494446');
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimitOk).mockResolvedValueOnce({ ok: false, remaining: 0 });
    const req = new Request('http://localhost/api/rep/robert-cashman/direct-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnstileToken: 'good-token' }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug: 'robert-cashman' }) });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/07535|7535494446|\+447535/);
  });
});
