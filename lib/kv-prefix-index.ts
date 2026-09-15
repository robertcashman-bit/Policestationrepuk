/**
 * Maintained Redis SET indexes for hot-path prefix scans (repreview, profile,
 * newrep, featured). Avoids KEYS on every public page load.
 *
 * Index keys use the `{prefix}index` naming that firm-outreach already uses
 * (`firmprospect:index`). Rebuild filters the literal member/key `index` so a
 * KEYS `{prefix}*` pass does not treat the index SET as a data row.
 *
 * First deploy / empty index: lazy rebuild from KEYS once, then SADD members.
 */

import { addToIndexSet, readIndexMembers } from '@/lib/kv-atomic';
import { getKV } from '@/lib/kv';

const MGET_CHUNK = 200;

function isMetaKey(rest: string): boolean {
  // `index` SET and rebuild staging (`index:rebuild`) must never become members.
  return rest === 'index' || rest.startsWith('index:') || rest.length === 0;
}

/** Extract id (email) from a full Redis key given the data prefix. */
export function idFromPrefixedKey(key: string, prefix: string): string | null {
  if (!key.startsWith(prefix)) return null;
  const rest = key.slice(prefix.length);
  if (isMetaKey(rest)) return null;
  return rest;
}

export async function removeFromIndexSet(indexKey: string, id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.srem(indexKey, id);
    return;
  } catch {
    // Legacy JSON array — rewrite without the id.
  }
  const ids = await readIndexMembers(indexKey);
  const next = ids.filter((x) => x !== id);
  if (next.length === ids.length) return;
  try {
    await kv.del(indexKey);
  } catch {
    return;
  }
  if (next.length === 0) return;
  const pipeline = kv.pipeline();
  for (const member of next) pipeline.sadd(indexKey, member);
  await pipeline.exec();
}

/**
 * Rebuild `{prefix}index` from KEYS `{prefix}*`. Returns the id list written.
 *
 * Uses a staging SET + RENAME so a failed chunk never leaves the live index
 * half-deleted, and concurrent `addIndexedId` members on the live key are
 * unioned into staging before the swap.
 */
export async function rebuildPrefixIndex(
  indexKey: string,
  prefix: string,
): Promise<string[]> {
  const kv = getKV();
  if (!kv) return [];
  let keys: string[] = [];
  try {
    keys = await kv.keys(`${prefix}*`);
  } catch (err) {
    console.error(`[kv-prefix-index] KEYS ${prefix}* failed:`, err);
    throw err instanceof Error ? err : new Error(String(err));
  }
  const fromKeys = keys
    .map((k) => idFromPrefixedKey(k, prefix))
    .filter((id): id is string => Boolean(id));

  // Union live members so a concurrent SADD is not dropped by the RENAME swap.
  const live = await readIndexMembers(indexKey);
  const idSet = new Set<string>([...fromKeys, ...live.filter((id) => !isMetaKey(id))]);
  const ids = [...idSet];

  const stagingKey = `${indexKey}:rebuild`;
  try {
    await kv.del(stagingKey);
  } catch {
    /* ignore */
  }

  if (ids.length === 0) {
    try {
      await kv.del(indexKey);
    } catch {
      /* ignore */
    }
    return [];
  }

  try {
    for (let i = 0; i < ids.length; i += MGET_CHUNK) {
      const chunk = ids.slice(i, i + MGET_CHUNK);
      const pipeline = kv.pipeline();
      for (const id of chunk) pipeline.sadd(stagingKey, id);
      await pipeline.exec();
    }
    await kv.rename(stagingKey, indexKey);
  } catch (err) {
    try {
      await kv.del(stagingKey);
    } catch {
      /* ignore */
    }
    console.error(`[kv-prefix-index] rebuild ${indexKey} failed:`, err);
    throw err instanceof Error ? err : new Error(String(err));
  }
  return ids;
}

/**
 * Read indexed ids. When the index is empty and `lazyRebuild` is true (default),
 * perform a one-shot KEYS backfill so first deploy after this change is not empty.
 */
export async function listIndexedIds(opts: {
  indexKey: string;
  prefix: string;
  lazyRebuild?: boolean;
}): Promise<string[]> {
  const existing = await readIndexMembers(opts.indexKey);
  if (existing.length > 0) {
    return existing.filter((id) => !isMetaKey(id));
  }
  if (opts.lazyRebuild === false) return [];
  return rebuildPrefixIndex(opts.indexKey, opts.prefix);
}

/** Pipeline GET for many keys (chunked). */
export async function mgetByKeys<T>(keys: string[]): Promise<(T | null)[]> {
  const kv = getKV();
  if (!kv || keys.length === 0) return [];
  const out: (T | null)[] = [];
  for (let i = 0; i < keys.length; i += MGET_CHUNK) {
    const chunk = keys.slice(i, i + MGET_CHUNK);
    const pipeline = kv.pipeline();
    for (const key of chunk) pipeline.get(key);
    const results = await pipeline.exec<(T | null)[]>();
    out.push(...results);
  }
  return out;
}

export async function addIndexedId(indexKey: string, id: string): Promise<void> {
  await addToIndexSet(indexKey, id);
}
