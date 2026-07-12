import type { FirmProspect, FirmProspectStatus } from './types';
/** Whether an initial outreach email was already recorded on this prospect. */
export declare function prospectHasInitialSend(prospect: Pick<FirmProspect, 'lastEmailAt' | 'sequenceStep'>): boolean;
/**
 * ready_to_send + lastEmailAt is a stale index state: a send already happened but status was
 * not moved to sent. Follow-ups are scheduled off status==='sent', so a ready_to_send row that
 * carries a lastEmailAt (at ANY sequenceStep) can never send — it just clogs the ready queue
 * and starves genuinely-sendable step-0 prospects. Reconcile it to sent regardless of step.
 */
export declare function reconcileReadyProspectStatus(prospect: Pick<FirmProspect, 'status' | 'lastEmailAt' | 'sequenceStep' | 'email'>): FirmProspectStatus | null;
/** True when a sent prospect is due for follow-up step 1 (day 7). */
export declare function isDueForFollowUpStep1(prospect: Pick<FirmProspect, 'sequenceStep' | 'lastEmailAt' | 'waLinkClickedAt' | 'joinedWhatsAppAt'>): boolean;
//# sourceMappingURL=reconcile-ready-status.d.ts.map