import {
  addSuppression,
  getProspectByEmail,
  saveProspect,
} from '../storage';
import { OUTREACH_CAMPAIGN_IDS } from '../site-config';
import { verifyUnsubscribeToken } from './unsubscribe-token';

export type ApplyUnsubscribeResult =
  | { ok: true; email: string; prospectsUpdated: number }
  | { ok: false; error: 'invalid_token' | 'missing_token' };

/**
 * Verify a signed unsubscribe token, suppress the address, and mark matching
 * prospects unsubscribed across all outreach campaigns.
 */
export async function applyUnsubscribeToken(
  token: string | null | undefined,
): Promise<ApplyUnsubscribeResult> {
  const raw = typeof token === 'string' ? token.trim() : '';
  if (!raw) return { ok: false, error: 'missing_token' };

  const payload = verifyUnsubscribeToken(decodeURIComponent(raw));
  if (!payload) return { ok: false, error: 'invalid_token' };

  const email = payload.email.trim().toLowerCase();
  await addSuppression(email, 'unsubscribe');

  let prospectsUpdated = 0;
  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    const prospect = await getProspectByEmail(email, campaignId);
    if (!prospect) continue;
    if (prospect.status === 'unsubscribed') continue;
    prospect.status = 'unsubscribed';
    prospect.updatedAt = new Date().toISOString();
    await saveProspect(prospect);
    prospectsUpdated += 1;
  }

  return { ok: true, email, prospectsUpdated };
}
