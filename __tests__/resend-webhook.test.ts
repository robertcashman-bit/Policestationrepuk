import { createHmac, randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

function whsecFromBytes(secretBytes: Buffer): string {
  return `whsec_${secretBytes.toString('base64')}`;
}

function signBody(secretBytes: Buffer, id: string, timestamp: string, body: string): string {
  const toSign = `${id}.${timestamp}.${body}`;
  const sig = createHmac('sha256', secretBytes).update(toSign).digest('base64');
  return `v1,${sig}`;
}

/** Captured after() tasks from the mocked next/server. */
const pendingAfterTasks: Array<() => Promise<unknown>> = [];

async function flushAfterTasks(): Promise<void> {
  const tasks = pendingAfterTasks.splice(0, pendingAfterTasks.length);
  await Promise.all(tasks.map((run) => run()));
}

describe('verifyResendWebhookSignature', () => {
  it('accepts a correctly signed payload', async () => {
    const { verifyResendWebhookSignature } = await import(
      '@/lib/firm-outreach/resend-webhook-verify'
    );
    const secretBytes = Buffer.from('test-webhook-secret');
    const secret = whsecFromBytes(secretBytes);
    const body = JSON.stringify({ type: 'email.delivered', data: { email_id: 'abc', to: ['a@b.com'] } });
    const id = 'msg_test_verify_ok';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signBody(secretBytes, id, timestamp, body);

    expect(
      verifyResendWebhookSignature(body, { id, timestamp, signature }, secret),
    ).toBe(true);
  });

  it('rejects a bad signature', async () => {
    const { verifyResendWebhookSignature } = await import(
      '@/lib/firm-outreach/resend-webhook-verify'
    );
    const secret = whsecFromBytes(Buffer.from('test-webhook-secret'));
    const body = '{"type":"email.delivered"}';
    expect(
      verifyResendWebhookSignature(
        body,
        { id: 'msg_x', timestamp: '1', signature: 'v1,bad' },
        secret,
      ),
    ).toBe(false);
  });

  it('rejects when secret missing in production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { verifyResendWebhookSignature } = await import(
      '@/lib/firm-outreach/resend-webhook-verify'
    );
    expect(
      verifyResendWebhookSignature('{}', { id: 'a', timestamp: '1', signature: 'v1,x' }, undefined),
    ).toBe(false);
    process.env.NODE_ENV = prev;
  });
});

describe('resend webhook route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    pendingAfterTasks.length = 0;

    vi.doMock('next/server', async () => {
      const actual = await vi.importActual<typeof import('next/server')>('next/server');
      return {
        ...actual,
        after: (task: (() => unknown) | Promise<unknown>) => {
          const run = async () => {
            if (typeof task === 'function') return await task();
            return await task;
          };
          pendingAfterTasks.push(run);
        },
      };
    });

    vi.doMock('@/lib/firm-outreach/email-jobs/storage', () => ({
      findEmailJobForWebhook: vi.fn(async () => null),
      markJobFromWebhookEvent: vi.fn(async () => undefined),
    }));
  });

  it('rejects requests without a valid signature in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RESEND_WEBHOOK_SECRET = whsecFromBytes(Buffer.from('route-secret'));
    const { POST } = await import('@/app/api/webhooks/resend/route');
    const res = await POST(
      new Request('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'email.sent', data: { to: 'a@b.com' } }),
      }),
    );
    expect(res.status).toBe(401);
    expect(pendingAfterTasks).toHaveLength(0);
  });

  it('accepts a signed delivery event and returns 200', async () => {
    const secretBytes = randomBytes(24);
    const secret = whsecFromBytes(secretBytes);
    process.env.NODE_ENV = 'production';
    process.env.RESEND_WEBHOOK_SECRET = secret;

    const applySendWebhookEvent = vi.fn(async () => null);
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      addSuppression: vi.fn(async () => undefined),
      applySendWebhookEvent,
      getProspect: vi.fn(async () => null),
      saveProspect: vi.fn(async () => undefined),
    }));

    const body = JSON.stringify({
      type: 'email.delivered',
      created_at: '2026-08-01T12:00:00.000Z',
      data: { email_id: 're_123', to: ['firm@example.co.uk'] },
    });
    const id = 'msg_signed_ok';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signBody(secretBytes, id, timestamp, body);

    const { POST } = await import('@/app/api/webhooks/resend/route');
    const res = await POST(
      new Request('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'svix-id': id,
          'svix-timestamp': timestamp,
          'svix-signature': signature,
        },
        body,
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(pendingAfterTasks).toHaveLength(1);
    expect(applySendWebhookEvent).not.toHaveBeenCalled();
    await flushAfterTasks();
    expect(applySendWebhookEvent).toHaveBeenCalled();
  });

  it('still returns 200 when storage throws after a valid signature', async () => {
    const secretBytes = randomBytes(24);
    const secret = whsecFromBytes(secretBytes);
    process.env.NODE_ENV = 'production';
    process.env.RESEND_WEBHOOK_SECRET = secret;

    vi.doMock('@/lib/firm-outreach/storage', () => ({
      addSuppression: vi.fn(async () => undefined),
      applySendWebhookEvent: vi.fn(async () => {
        throw new Error('KV down');
      }),
      getProspect: vi.fn(async () => null),
      saveProspect: vi.fn(async () => undefined),
    }));

    const body = JSON.stringify({
      type: 'email.bounced',
      data: { email_id: 're_456', to: ['bad@example.co.uk'] },
    });
    const id = 'msg_signed_err';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signBody(secretBytes, id, timestamp, body);

    const { POST } = await import('@/app/api/webhooks/resend/route');
    const res = await POST(
      new Request('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'svix-id': id,
          'svix-timestamp': timestamp,
          'svix-signature': signature,
        },
        body,
      }),
    );
    expect(res.status).toBe(200);
    // Side-effect errors must not reject the after task into an unhandled rejection.
    await expect(flushAfterTasks()).resolves.toBeUndefined();
  });

  it('returns 200 within a couple seconds even if storage is slow', async () => {
    const secretBytes = randomBytes(24);
    const secret = whsecFromBytes(secretBytes);
    process.env.NODE_ENV = 'production';
    process.env.RESEND_WEBHOOK_SECRET = secret;

    let resolveSlow: ((value: null) => void) | undefined;
    const slowLookup = new Promise<null>((resolve) => {
      resolveSlow = resolve;
    });

    vi.doMock('@/lib/firm-outreach/email-jobs/storage', () => ({
      findEmailJobForWebhook: vi.fn(() => slowLookup),
      markJobFromWebhookEvent: vi.fn(async () => undefined),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      addSuppression: vi.fn(async () => undefined),
      applySendWebhookEvent: vi.fn(async () => null),
      getProspect: vi.fn(async () => null),
      saveProspect: vi.fn(async () => undefined),
    }));

    const body = JSON.stringify({
      type: 'email.delivered',
      data: { email_id: 're_slow', to: ['slow@example.co.uk'] },
    });
    const id = 'msg_signed_slow';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signBody(secretBytes, id, timestamp, body);

    const { POST } = await import('@/app/api/webhooks/resend/route');
    const started = Date.now();
    const res = await POST(
      new Request('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'svix-id': id,
          'svix-timestamp': timestamp,
          'svix-signature': signature,
        },
        body,
      }),
    );
    const elapsedMs = Date.now() - started;

    expect(res.status).toBe(200);
    expect(elapsedMs).toBeLessThan(2000);
    expect(pendingAfterTasks).toHaveLength(1);

    // Unblock background work so the test process can exit cleanly.
    resolveSlow?.(null);
    await flushAfterTasks();
  });
});
