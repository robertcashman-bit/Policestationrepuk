import { Webhook } from 'standardwebhooks';

/**
 * Verify a Resend/Svix webhook using the raw body and signing secret.
 * Does not require RESEND_API_KEY — signature check is local HMAC only.
 */
export function verifyResendWebhookSignature(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string | undefined,
): boolean {
  const trimmed = secret?.trim();
  if (!trimmed) {
    return process.env.NODE_ENV !== 'production';
  }

  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;

  try {
    // Resend SDK maps svix-* → webhook-* for standardwebhooks.
    new Webhook(trimmed).verify(rawBody, {
      'webhook-id': id,
      'webhook-timestamp': timestamp,
      'webhook-signature': signature,
    });
    return true;
  } catch {
    return false;
  }
}
