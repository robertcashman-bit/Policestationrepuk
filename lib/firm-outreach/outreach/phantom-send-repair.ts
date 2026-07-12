import { isProviderAcceptedMessageId } from '@robertcashman/firm-outreach-core';
import type { FirmOutreachSend, FirmProspect } from '../types';

const TERMINAL_PROSPECT_STATUSES = new Set<FirmProspect['status']>([
  'unsubscribed',
  'bounced',
  'joined_whatsapp',
]);

export function isPhantomSend(send: FirmOutreachSend): boolean {
  if (!send.sentAt && send.status === 'queued') return false;
  return !isProviderAcceptedMessageId(send.resendMessageId);
}

export function realSendsForCampaign(
  sends: FirmOutreachSend[],
  campaignId: string,
): FirmOutreachSend[] {
  return sends.filter(
    (s) => s.campaignId === campaignId && isProviderAcceptedMessageId(s.resendMessageId),
  );
}

/**
 * Recompute prospect outreach state from provider-confirmed sends only.
 * Returns null when the prospect row should not change.
 */
export function reconcileProspectAfterPhantomRemoval(
  prospect: FirmProspect,
  sends: FirmOutreachSend[],
): FirmProspect | null {
  if (TERMINAL_PROSPECT_STATUSES.has(prospect.status)) return null;

  const real = realSendsForCampaign(sends, prospect.campaignId).sort((a, b) =>
    (b.sentAt ?? b.createdAt).localeCompare(a.sentAt ?? a.createdAt),
  );

  const now = new Date().toISOString();

  if (real.length === 0) {
    if (prospect.status === 'ready_to_send' && prospect.sequenceStep === 0 && !prospect.lastEmailAt) {
      return null;
    }
    const next: FirmProspect = {
      ...prospect,
      status: 'ready_to_send',
      sequenceStep: 0,
      updatedAt: now,
    };
    delete next.lastEmailAt;
    return next;
  }

  const maxStep = Math.max(...real.map((s) => s.sequenceStep));
  const latest = real[0];
  const lastEmailAt = latest.sentAt ?? latest.createdAt;

  if (
    prospect.status === 'sent' &&
    prospect.sequenceStep === maxStep &&
    prospect.lastEmailAt === lastEmailAt
  ) {
    return null;
  }

  return {
    ...prospect,
    status: 'sent',
    sequenceStep: maxStep,
    lastEmailAt,
    updatedAt: now,
  };
}

export function countRealSendsByDayCampaign(
  sends: FirmOutreachSend[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const send of sends) {
    if (!isProviderAcceptedMessageId(send.resendMessageId) || !send.sentAt) continue;
    const day = send.sentAt.slice(0, 10);
    const key = `${send.campaignId}:${day}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
