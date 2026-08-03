import { getKV } from '@/lib/kv';
import { claimKey } from '@/lib/kv-atomic';
import crypto from 'crypto';

/** Recover stale locks before the 300s Vercel cron ceiling. */
const RUN_LOCK_TTL_SECONDS = 270;

export type OutreachRunMode = 'send' | 'enrich' | 'maintain' | 'discovery';

function runLockKey(mode: OutreachRunMode): string {
  return `firmoutreach:lock:${mode}`;
}

function prospectSendKey(prospectId: string): string {
  return `firmoutreach:send:claim:${prospectId}`;
}

function newLockToken(): string {
  return `${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Claim an outreach run lock. Returns an owner token on success (release with
 * the same token), or null when another run holds the lock.
 */
export async function claimOutreachRunLock(
  mode: OutreachRunMode,
): Promise<string | null> {
  const token = newLockToken();
  const ok = await claimKey(runLockKey(mode), RUN_LOCK_TTL_SECONDS, token);
  return ok ? token : null;
}

/** Release only if this caller still owns the lock (avoids deleting a successor's claim). */
export async function releaseOutreachRunLock(
  mode: OutreachRunMode,
  token: string,
): Promise<void> {
  const kv = getKV();
  if (!kv || !token) return;
  const key = runLockKey(mode);
  try {
    const current = await kv.get<string>(key);
    if (current === token) await kv.del(key);
  } catch {
    /* ignore — TTL still recovers */
  }
}

/** Prevent duplicate concurrent sends for the same prospect. Returns owner token. */
export async function claimProspectSend(prospectId: string): Promise<string | null> {
  const token = newLockToken();
  const ok = await claimKey(prospectSendKey(prospectId), 3600, token);
  return ok ? token : null;
}

/** Drop the prospect send claim after a failed attempt so retries are not blocked for 1h. */
export async function releaseProspectSend(
  prospectId: string,
  token: string,
): Promise<void> {
  const kv = getKV();
  if (!kv || !token) return;
  const key = prospectSendKey(prospectId);
  try {
    const current = await kv.get<string>(key);
    if (current === token) await kv.del(key);
  } catch {
    /* ignore */
  }
}
