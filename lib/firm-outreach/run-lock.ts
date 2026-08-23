import { claimKey } from '@/lib/kv-atomic';
import { getKV } from '@/lib/kv';

/**
 * Recover stale locks before the 300s Vercel cron ceiling.
 * Callers MUST release in a finally block — a hung/timed-out tick that
 * never releases used to overlap-skip every later tick until TTL expired.
 */
export const OUTREACH_RUN_LOCK_TTL_SECONDS = 270;

export type OutreachRunMode = 'send' | 'enrich' | 'maintain' | 'discovery' | 'autoheal';

export function outreachRunLockKey(mode: OutreachRunMode): string {
  return `firmoutreach:lock:${mode}`;
}

export async function claimOutreachRunLock(mode: OutreachRunMode): Promise<boolean> {
  return claimKey(outreachRunLockKey(mode), OUTREACH_RUN_LOCK_TTL_SECONDS);
}

/** Drop the mode lock so the next tick is not stuck on overlap. */
export async function releaseOutreachRunLock(mode: OutreachRunMode): Promise<void> {
  const kv = getKV();
  if (!kv || typeof kv.del !== 'function') return;
  try {
    await kv.del(outreachRunLockKey(mode));
  } catch {
    // Best-effort — TTL still recovers a wedged lock.
  }
}

/** Prevent duplicate concurrent sends for the same prospect. */
export async function claimProspectSend(prospectId: string): Promise<boolean> {
  return claimKey(`firmoutreach:send:claim:${prospectId}`, 3600);
}
