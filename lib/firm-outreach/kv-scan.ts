import { getKV } from '@/lib/kv';

type ScanResult = [string | number, string[]] | { cursor: string | number; keys: string[] };

function normalizeScanResult(result: ScanResult): { cursor: string; keys: string[] } {
  if (Array.isArray(result)) {
    const cursor = String(result[0] ?? '0');
    const keys = Array.isArray(result[1]) ? result[1].map(String) : [];
    return { cursor, keys };
  }
  return {
    cursor: String(result?.cursor ?? '0'),
    keys: Array.isArray(result?.keys) ? result.keys.map(String) : [],
  };
}

/**
 * Scan Redis keys matching a pattern (Upstash SCAN).
 * Caps iterations so sparse MATCH patterns cannot walk a huge shared DB forever.
 */
export async function scanKeys(
  match: string,
  opts?: { count?: number; maxIterations?: number },
): Promise<string[]> {
  const kv = getKV();
  if (!kv || typeof kv.scan !== 'function') return [];

  const count = opts?.count ?? 200;
  const maxIterations = opts?.maxIterations ?? 80;
  const out: string[] = [];
  let cursor: string | number = 0;

  for (let i = 0; i < maxIterations; i++) {
    const result = (await kv.scan(cursor, { match, count })) as ScanResult;
    const { cursor: next, keys } = normalizeScanResult(result);
    for (const key of keys) out.push(key);
    cursor = next;
    if (cursor === '0') break;
  }

  return out;
}

/** Delete keys in small pipelines. Returns number deleted. */
export async function deleteKeys(keys: string[]): Promise<number> {
  const kv = getKV();
  if (!kv || keys.length === 0) return 0;

  const unique = [...new Set(keys)];
  let deleted = 0;
  const BATCH = 50;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const pipeline = kv.pipeline();
    for (const key of batch) pipeline.del(key);
    await pipeline.exec();
    deleted += batch.length;
  }
  return deleted;
}
