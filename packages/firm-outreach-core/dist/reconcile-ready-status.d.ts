import type { FirmProspect, FirmProspectStatus } from './types';
/** Whether any outreach email was already recorded on this prospect. */
export declare function prospectHasInitialSend(prospect: Pick<FirmProspect, 'lastEmailAt' | 'sequenceStep'>): boolean;
/**
 * ready_to_send + lastEmailAt is a stale index state: a send already happened
 * but status was not moved to sent (or was re-promoted). That floods the send
 * queue with no_step skips and blocks genuine ready initials + due follow-ups.
 */
export declare function reconcileReadyProspectStatus(prospect: Pick<FirmProspect, 'status' | 'lastEmailAt' | 'sequenceStep' | 'email'>): FirmProspectStatus | null;
/** True when a sent prospect is due for follow-up step 1 (day 7). */
export declare function isDueForFollowUpStep1(prospect: Pick<FirmProspect, 'sequenceStep' | 'lastEmailAt' | 'waLinkClickedAt' | 'joinedWhatsAppAt'>): boolean;
//# sourceMappingURL=reconcile-ready-status.d.ts.map