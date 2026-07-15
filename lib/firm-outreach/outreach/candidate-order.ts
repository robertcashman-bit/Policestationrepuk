import { computeProspectPriority } from '@robertcashman/firm-outreach-core';
import type { FirmProspect } from '../types';
import { nextOutreachStep } from './sequence';

/**
 * Order candidates so due/sendable prospects are considered first.
 * Priority score is the tie-breaker. Used before any limit/slice so truncation
 * by scan size cannot drop due rows that happen to sit late in the KV index.
 */
export function orderProspectsForSendQueue(
  prospects: FirmProspect[],
  nowMs = Date.now(),
): FirmProspect[] {
  return [...prospects].sort((a, b) => {
    const aDue = nextOutreachStep(a, nowMs) !== null ? 1 : 0;
    const bDue = nextOutreachStep(b, nowMs) !== null ? 1 : 0;
    if (aDue !== bDue) return bDue - aDue;
    return computeProspectPriority(b) - computeProspectPriority(a);
  });
}
