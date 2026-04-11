import { test, expect } from '@playwright/test';

const BASE = process.env.PW_BASE_URL || 'https://policestationrepuk.org';
const TS = Date.now();

function apiUrl(path: string) {
  return `${BASE}${path}`;
}

test.describe.configure({ mode: 'serial' });

test.describe('POST /api/register', () => {
  test('accepts valid payload (200 or 429 if rate-limited)', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: {
        name: `API Test ${TS}`,
        email: `api-test-${TS}@example.com`,
        phone: '07700900001',
        accreditation: 'PSRAS',
        counties: ['Kent'],
        stations: ['Maidstone'],
        availability: 'full-time',
        message: 'Playwright API test',
        _hp: '',
      },
    });
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.id).toBeTruthy();
    }
  });

  test('rejects missing name', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: { email: 'test@example.com' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('name');
  });

  test('rejects missing email', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: { name: 'Test' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('email');
  });

  test('rejects invalid email format', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: { name: 'Test', email: 'not-valid' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('email');
  });

  test('rejects oversized payload', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: {
        name: 'A'.repeat(201),
        email: 'big@example.com',
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('length');
  });

  test('honeypot filled returns 200 with noop id', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: {
        name: 'Bot',
        email: 'bot@example.com',
        _hp: 'http://spam.example',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('noop');
  });

  test('GET method is not allowed', async ({ request }) => {
    const res = await request.get(apiUrl('/api/register'));
    expect(res.status()).toBe(405);
  });

  test('handles counties as string (200 or 429)', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: {
        name: `String Counties ${TS}`,
        email: `str-counties-${TS}@example.com`,
        counties: 'Kent, London',
        stations: 'Maidstone',
        _hp: '',
      },
    });
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.ok).toBe(true);
    }
  });

  test('handles counties as array (200 or 429)', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: {
        name: `Array Counties ${TS}`,
        email: `arr-counties-${TS}@example.com`,
        counties: ['Kent', 'London'],
        stations: ['Maidstone', 'Canterbury'],
        _hp: '',
      },
    });
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.ok).toBe(true);
    }
  });

  test('handles empty optional fields (200 or 429)', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: {
        name: `Minimal ${TS}`,
        email: `minimal-${TS}@example.com`,
        _hp: '',
      },
    });
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.ok).toBe(true);
    }
  });

  test('special characters in name accepted (200 or 429)', async ({ request }) => {
    const res = await request.post(apiUrl('/api/register'), {
      data: {
        name: `O'Brien-Smyth & Partners ${TS}`,
        email: `special-${TS}@example.com`,
        _hp: '',
      },
    });
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.ok).toBe(true);
    }
  });
});

test.describe('Other API routes load', () => {
  test('GET /api/stations returns data', async ({ request }) => {
    const res = await request.get(apiUrl('/api/stations'));
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/send-code rejects missing email', async ({ request }) => {
    const res = await request.post(apiUrl('/api/auth/send-code'), {
      data: {},
    });
    expect([400, 422, 503]).toContain(res.status());
  });

  test('POST /api/contact rejects empty body', async ({ request }) => {
    const res = await request.post(apiUrl('/api/contact'), {
      data: {},
    });
    expect(res.status()).toBe(400);
  });
});
