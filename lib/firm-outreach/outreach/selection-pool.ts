/**
 * Ready/sent scan sizing for the live send worker.
 *
 * PR #22 clamped both limits with Math.min(remaining, 40|50). Under unlimited
 * batch (PR #16) remaining is Number.MAX_SAFE_INTEGER, so that always became
 * sentLimit=40 — follow-up zombies in the first 40 hid truly due follow-ups
 * beyond the scan (preview uses 500 and still saw them as eligible).
 */
export function outreachSelectionPoolLimits(remaining: number): {
  readyLimit: number;
  sentLimit: number;
} {
  const unlimited =
    !Number.isFinite(remaining) || remaining >= Number.MAX_SAFE_INTEGER / 2;

  if (unlimited) {
    return { readyLimit: 200, sentLimit: 200 };
  }

  const finite = Math.max(0, Math.floor(remaining));
  return {
    readyLimit: Math.min(50, Math.max(20, Math.min(finite, 50))),
    sentLimit: Math.min(200, Math.max(40, Math.min(finite, 200))),
  };
}
