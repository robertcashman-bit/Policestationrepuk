import { getKV } from '@/lib/kv';

/** Atomic SET NX — returns true when this caller claimed the key. */
export async function claimKey(
  key: string,
  ttlSeconds: number,
  value = new Date().toISOString(),
): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  const result = await kv.set(key, value, { nx: true, ex: ttlSeconds });
  // @upstash/redis returns "OK"; some clients/mocks return true.
  return result === 'OK' || (result as unknown) === true;
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

function isWrongTypeError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /WRONGTYPE/i.test(msg);
}

type KvLike = NonNullable<ReturnType<typeof getKV>>;

async function safeDel(kv: KvLike, key: string): Promise<boolean> {
  if (typeof kv.del !== 'function') return false;
  try {
    await kv.del(key);
    return true;
  } catch {
    return false;
  }
}

async function writeSetMembers(kv: KvLike, key: string, members: string[]): Promise<void> {
  if (members.length === 0) return;
  const pipeline = kv.pipeline();
  for (const member of members) pipeline.sadd(key, member);
  await pipeline.exec();
}

/**
 * Read string index — Redis SET (SMEMBERS) with legacy JSON array fallback.
 * Never throws WRONGTYPE: empty SETs, JSON strings, and mixed states all return [].
 */
export async function readIndexMembers(key: string): Promise<string[]> {
  const kv = getKV();
  if (!kv) return [];

  let smembersOk = false;
  try {
    const members = await kv.smembers(key);
    if (Array.isArray(members)) {
      smembersOk = true;
      if (members.length > 0) return members.map(String);
      // [] means empty SET or missing key — try legacy JSON next, catch WRONGTYPE.
    }
  } catch {
    // Key may be legacy JSON array type — fall through to GET.
  }

  try {
    const raw = await kv.get<string[]>(key);
    if (!Array.isArray(raw) || raw.length === 0) return [];

    // Legacy JSON array — replace with a Redis SET (delete first; SADD on string keys fails).
    const deleted = await safeDel(kv, key);
    if (deleted) {
      await writeSetMembers(kv, key, raw.map(String));
    }
    return raw.map(String);
  } catch (err) {
    if (isWrongTypeError(err) || smembersOk) {
      // Key is a Redis SET (possibly empty) — SMEMBERS is authoritative.
      try {
        const members = await kv.smembers(key);
        return Array.isArray(members) ? members.map(String) : [];
      } catch {
        return [];
      }
    }
    throw err;
  }
}

/** Atomically add a unique id to a string index (Redis SADD). */
export async function addToIndexSet(key: string, id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.sadd(key, id);
    return;
  } catch {
    // Key may be legacy JSON array — migrate then SADD.
  }

  let legacy: string[] = [];
  try {
    const raw = await kv.get<string[]>(key);
    if (Array.isArray(raw)) legacy = raw.map(String);
  } catch (err) {
    if (!isWrongTypeError(err)) throw err;
    // Already a SET (or other) — retry SADD once.
    try {
      await kv.sadd(key, id);
    } catch {
      // give up quietly; caller can retry later
    }
    return;
  }

  const deleted = await safeDel(kv, key);
  if (!deleted) {
    // Cannot migrate without DEL; best-effort SADD may still fail on string keys.
    try {
      await kv.sadd(key, id);
    } catch {
      /* ignore */
    }
    return;
  }

  const members = legacy.includes(id) ? legacy : [...legacy, id];
  await writeSetMembers(kv, key, members);
}

/** @deprecated Use addToIndexSet — kept for callers migrating from RMW append. */
export async function appendUniqueToIndex(
  key: string,
  id: string,
): Promise<void> {
  await addToIndexSet(key, id);
}
