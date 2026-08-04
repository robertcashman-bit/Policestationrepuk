import { getKV } from '@/lib/kv';
import { claimKey } from '@/lib/kv-atomic';
import crypto from 'crypto';

/** Recover stale locks before the 300s Vercel cron ceiling. */
const RUN_LOCK_TTL_SECONDS = 270;

/** Bit production historically stored ISO timestamps; droid stores owner tokens. */
const STALE_LOCK_GRACE_MS = 5_000;

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
 * Parse lock age from either an ISO timestamp (legacy bit) or a droid token
 * (`<Date.now().toString(36)>_<hex>`). Returns null when unknown.
 */
export function lockAgeMs(value: string | null | undefined, now = Date.now()): number | null {
  if (!value || typeof value !== 'string') return null;
  const iso = Date.parse(value);
  if (Number.isFinite(iso)) return Math.max(0, now - iso);
  const prefix = value.split('_')[0];
  if (!prefix) return null;
  const parsed = Number.parseInt(prefix, 36);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  // Reject absurd future / ancient values.
  if (parsed > now + 60_000 || parsed < now - 7 * 24 * 60 * 60 * 1000) return null;
  return Math.max(0, now - parsed);
}

function isStaleLockValue(value: string | null | undefined, ttlSeconds: number): boolean {
  const age = lockAgeMs(value);
  if (age == null) return false;
  return age >= ttlSeconds * 1000 + STALE_LOCK_GRACE_MS;
}

/**
 * Claim an outreach run lock. Returns an owner token on success (release with
 * the same token), or null when another run holds the lock.
 *
 * Recovers stale locks left by bit builds that never called release (TTL-only).
 */
export async function claimOutreachRunLock(
  mode: OutreachRunMode,
): Promise<string | null> {
  const token = newLockToken();
  const key = runLockKey(mode);
  const ok = await claimKey(key, RUN_LOCK_TTL_SECONDS, token);
  if (ok) return token;

  const kv = getKV();
  if (!kv) return null;
  try {
    const current = await kv.get<string>(key);
    if (!isStaleLockValue(current, RUN_LOCK_TTL_SECONDS)) return null;
    await kv.del(key);
    const retry = await claimKey(key, RUN_LOCK_TTL_SECONDS, token);
    return retry ? token : null;
  } catch {
    return null;
  }
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

/**
 * Operator/kick escape hatch: delete a stuck run lock (e.g. pre-release builds
 * that claimed without releasing). Prefer normal release with owner token.
 */
export async function forceClearOutreachRunLock(mode: OutreachRunMode): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  try {
    await kv.del(runLockKey(mode));
    return true;
  } catch {
    return false;
  }
}

/** Prevent duplicate concurrent sends for the same prospect. Returns owner token. */
export async function claimProspectSend(prospectId: string): Promise<string | null> {
  const token = newLockToken();
  const key = prospectSendKey(prospectId);
  const ok = await claimKey(key, 3600, token);
  if (ok) return token;

  const kv = getKV();
  if (!kv) return null;
  try {
    const current = await kv.get<string>(key);
    if (!isStaleLockValue(current, 3600)) return null;
    await kv.del(key);
    const retry = await claimKey(key, 3600, token);
    return retry ? token : null;
  } catch {
    return null;
  }
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
