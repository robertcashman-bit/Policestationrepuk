import { describe, expect, it } from 'vitest';

describe('health and ready endpoints', () => {
  it('health returns ok without secrets', async () => {
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('policestationrepuk');
  });

  it('ready hides check flags from unauthenticated callers', async () => {
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test-cron-secret-unauth';
    try {
      const { GET } = await import('@/app/api/ready/route');
      const res = await GET(new Request('http://localhost/api/ready'));
      const body = await res.json();
      expect(body.ok).toBeTypeOf('boolean');
      expect(body.timestamp).toBeTypeOf('string');
      expect(body.checks).toBeUndefined();
      expect(Object.keys(body)).not.toContain('CRON_SECRET');
    } finally {
      if (prev === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prev;
    }
  });

  it('ready reports check flags to authorised callers without exposing secrets', async () => {
    const secret = 'test-cron-secret-auth';
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = secret;
    try {
      const { GET } = await import('@/app/api/ready/route');
      const res = await GET(
        new Request('http://localhost/api/ready', {
          headers: { authorization: `Bearer ${secret}` },
        }),
      );
      const body = await res.json();
      expect(body.checks).toBeDefined();
      expect(body.checks.cronSecretConfigured).toBeTypeOf('boolean');
      expect(body.checks.resendConfigured).toBeTypeOf('boolean');
      expect(Object.keys(body)).not.toContain('CRON_SECRET');
    } finally {
      if (prev === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prev;
    }
  });
});
