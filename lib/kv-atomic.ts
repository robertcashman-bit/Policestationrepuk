import { getKV } from '@/lib/kv';

function isWrongTypeError(err: unknown): boolean {
  return /WRONGTYPE/i.test(String(err));
}

/** Atomic SET NX — returns true when this caller claimed the key. */
export async function claimKey(
  key: string,
  ttlSeconds: number,
  value = new Date().toISOString(),
): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  const result = await kv.set(key, value, { nx: true, ex: ttlSeconds });
  return result === 'OK';
}

/** Release a key claimed via claimKey (best-effort DEL; lease TTL is the fallback). */
export async function releaseKey(key: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.del(key);
  } catch {
    // Lease will expire on its own TTL if DEL fails.
  }
}

/** Increment a counter with TTL refresh (uses Redis INCR when available). */
export async function incrementCounter(
  key: string,
  ttlSeconds: number,
): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  const next = await kv.incr(key);
  if (next === 1) {
    await kv.expire(key, ttlSeconds);
  }
  return next;
}

async function migrateStringArrayToSet(key: string, members: string[]): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  // Must DEL first — SADD against a Redis STRING (JSON array) throws WRONGTYPE.
  await kv.del(key);
  if (members.length === 0) return;
  const pipeline = kv.pipeline();
  for (const id of members) pipeline.sadd(key, id);
  await pipeline.exec();
}

/**
 * Read string index — Redis SET (SMEMBERS) with legacy JSON array fallback.
 * Legacy keys written via `kv.set(key, string[])` are migrated to SET on read.
 */
export async function readIndexMembers(key: string): Promise<string[]> {
  const kv = getKV();
  if (!kv) return [];

  try {
    const members = await kv.smembers(key);
    if (Array.isArray(members)) {
      return members.map(String);
    }
  } catch (err) {
    if (!isWrongTypeError(err)) {
      // Unexpected Redis error — try legacy path once.
      console.warn(`[kv-atomic] smembers failed for ${key}:`, err);
    }
  }

  let raw: string[] | null = null;
  try {
    raw = await kv.get<string[]>(key);
  } catch (err) {
    if (isWrongTypeError(err)) {
      // Key is already a SET but smembers failed earlier oddly — retry smembers.
      try {
        const members = await kv.smembers(key);
        return Array.isArray(members) ? members.map(String) : [];
      } catch {
        return [];
      }
    }
    throw err;
  }

  if (!Array.isArray(raw) || raw.length === 0) return [];

  try {
    await migrateStringArrayToSet(key, raw.map(String));
  } catch (err) {
    console.error(`[kv-atomic] failed to migrate index ${key} to SET:`, err);
    // Still return the members so callers can proceed this request.
  }
  return raw.map(String);
}

/** Atomically add a unique id to a string index (Redis SADD), migrating legacy JSON arrays. */
export async function addToIndexSet(key: string, id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.sadd(key, id);
  } catch (err) {
    if (!isWrongTypeError(err)) throw err;
    // Migrate legacy string/JSON index, then SADD the new id.
    const members = await readIndexMembers(key);
    if (!members.includes(id)) {
      await kv.sadd(key, id);
    }
  }
}

/** @deprecated Use addToIndexSet — kept for callers migrating from RMW append. */
export async function appendUniqueToIndex(
  key: string,
  id: string,
): Promise<void> {
  await addToIndexSet(key, id);
}
