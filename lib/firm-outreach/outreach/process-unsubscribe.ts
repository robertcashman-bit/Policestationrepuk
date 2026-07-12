import { addSuppression, getProspectByEmail, saveProspect } from '@/lib/firm-outreach/storage';
import { verifyUnsubscribeToken } from '@/lib/firm-outreach/outreach/unsubscribe-token';

export interface UnsubscribeResult {
  ok: boolean;
  email?: string;
}

/**
 * Verify a signed unsubscribe token and suppress the address immediately.
 * Shared by the human-facing page and the RFC 8058 one-click POST endpoint.
 * Idempotent: re-running for an already-suppressed address is a no-op overwrite.
 */
export async function processUnsubscribe(rawToken: string): Promise<UnsubscribeResult> {
  const payload = verifyUnsubscribeToken(decodeURIComponent(rawToken));
  if (!payload) return { ok: false };

  await addSuppression(payload.email, 'unsubscribe');
  const prospect = await getProspectByEmail(payload.email);
  if (prospect && prospect.status !== 'unsubscribed') {
    prospect.status = 'unsubscribed';
    prospect.updatedAt = new Date().toISOString();
    await saveProspect(prospect);
  }
  return { ok: true, email: payload.email };
}
