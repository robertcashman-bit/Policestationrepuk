import { createHmac, randomBytes } from 'node:crypto';

export function whsecFromBytes(secretBytes: Buffer): string {
  return `whsec_${secretBytes.toString('base64')}`;
}

/** Decode a Resend/Svix `whsec_…` secret to raw HMAC key bytes. */
export function decodeWhsec(secret: string): Buffer {
  const trimmed = secret.trim();
  if (!trimmed.startsWith('whsec_')) {
    throw new Error('RESEND_WEBHOOK_SECRET must start with whsec_');
  }
  return Buffer.from(trimmed.slice('whsec_'.length), 'base64');
}

export function signResendWebhookBody(
  secretBytes: Buffer,
  id: string,
  timestamp: string,
  body: string,
): string {
  const toSign = `${id}.${timestamp}.${body}`;
  const sig = createHmac('sha256', secretBytes).update(toSign).digest('base64');
  return `v1,${sig}`;
}

export interface SignedWebhookProbeResult {
  ok: boolean;
  status: number;
  body: string;
}

/**
 * POST a signed no-op email.delivered event to prove production verify works.
 * Uses a random email_id so applySendWebhookEvent is a no-op (no matching send).
 */
export async function probeSignedResendWebhook(opts: {
  baseUrl: string;
  webhookSecret: string;
  fetchFn?: typeof fetch;
}): Promise<SignedWebhookProbeResult> {
  const secretBytes = decodeWhsec(opts.webhookSecret);
  const body = JSON.stringify({
    type: 'email.delivered',
    created_at: new Date().toISOString(),
    data: {
      email_id: `probe_${randomBytes(8).toString('hex')}`,
      to: ['webhook-probe@policestationrepuk.org'],
    },
  });
  const id = `msg_probe_${randomBytes(6).toString('hex')}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signResendWebhookBody(secretBytes, id, timestamp, body);
  const url = `${opts.baseUrl.replace(/\/$/, '')}/api/webhooks/resend`;
  const fetchFn = opts.fetchFn ?? fetch;
  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'svix-id': id,
      'svix-timestamp': timestamp,
      'svix-signature': signature,
    },
    body,
  });
  const text = await res.text();
  return { ok: res.status === 200, status: res.status, body: text.slice(0, 500) };
}
