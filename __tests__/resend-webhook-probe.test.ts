import { describe, expect, it, vi } from 'vitest';
import {
  decodeWhsec,
  probeSignedResendWebhook,
  signResendWebhookBody,
  whsecFromBytes,
} from '@/lib/firm-outreach/resend-webhook-probe';
import { verifyResendWebhookSignature } from '@/lib/firm-outreach/resend-webhook-verify';

describe('resend webhook probe signing', () => {
  it('round-trips through verifyResendWebhookSignature', () => {
    const secretBytes = Buffer.from('probe-secret-bytes');
    const secret = whsecFromBytes(secretBytes);
    expect(decodeWhsec(secret).equals(secretBytes)).toBe(true);

    const body = JSON.stringify({ type: 'email.delivered', data: { email_id: 'x' } });
    const id = 'msg_roundtrip';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signResendWebhookBody(secretBytes, id, timestamp, body);

    expect(
      verifyResendWebhookSignature(body, { id, timestamp, signature }, secret),
    ).toBe(true);
  });

  it('probeSignedResendWebhook posts signed headers and accepts 200', async () => {
    const secretBytes = Buffer.from('probe-secret-bytes');
    const secret = whsecFromBytes(secretBytes);
    const fetchFn = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      const body = String(init?.body ?? '');
      const ok = verifyResendWebhookSignature(
        body,
        {
          id: headers['svix-id'],
          timestamp: headers['svix-timestamp'],
          signature: headers['svix-signature'],
        },
        secret,
      );
      return {
        status: ok ? 200 : 401,
        text: async () => (ok ? '{"ok":true}' : '{"error":"Invalid webhook signature"}'),
      };
    });

    const result = await probeSignedResendWebhook({
      baseUrl: 'https://example.com',
      webhookSecret: secret,
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledOnce();
  });
});
