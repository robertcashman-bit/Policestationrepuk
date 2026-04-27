import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

/**
 * During `next build` static page generation, @upstash/redis issues uncached
 * fetches that trigger Next.js "Dynamic server usage" and flood the build log.
 * File-based data is enough for the pre-rendered HTML; KV is used at request
 * time (and after ISR) when this phase is not active.
 */
export function skipKVInPrerender(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export function getKV(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}
