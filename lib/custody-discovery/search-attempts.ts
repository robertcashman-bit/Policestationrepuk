/**
 * Persist per-query search attempts so exhausted strategies are visible and
 * we avoid blind identical retries without learning.
 */

import crypto from 'crypto';
import { getKV } from '@/lib/kv';
import type { StationSearchAttempt, SearchAttemptStatus } from './types';

const ATTEMPT_PREFIX = 'custodysearchattempt:';
const ATTEMPT_SUITE_INDEX = 'custodysearchattempt:suite:';
const ATTEMPT_TTL_SEC = 60 * 60 * 24 * 90; // 90 days

function attemptKey(id: string): string {
  return `${ATTEMPT_PREFIX}${id}`;
}

function suiteIndexKey(stationId: string): string {
  return `${ATTEMPT_SUITE_INDEX}${stationId}`;
}

export function newSearchAttemptId(): string {
  return `csa_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

export async function recordSearchAttempt(input: {
  stationId: string;
  query: string;
  provider: string;
  strategy: string;
  status: SearchAttemptStatus;
  resultCount: number;
  errorCode?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}): Promise<StationSearchAttempt | null> {
  const kv = getKV();
  if (!kv) return null;

  const now = input.completedAt ?? new Date().toISOString();
  const row: StationSearchAttempt = {
    id: newSearchAttemptId(),
    stationId: input.stationId,
    query: input.query,
    provider: input.provider,
    strategy: input.strategy,
    status: input.status,
    resultCount: input.resultCount,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    startedAt: input.startedAt,
    completedAt: now,
    createdAt: now,
  };

  await kv.set(attemptKey(row.id), row, { ex: ATTEMPT_TTL_SEC });
  const indexKey = suiteIndexKey(input.stationId);
  const existing = (await kv.get<string[]>(indexKey)) ?? [];
  const next = [row.id, ...existing.filter((id) => id !== row.id)].slice(0, 80);
  await kv.set(indexKey, next, { ex: ATTEMPT_TTL_SEC });
  return row;
}

export async function listSearchAttemptsForStation(
  stationId: string,
  limit = 40,
): Promise<StationSearchAttempt[]> {
  const kv = getKV();
  if (!kv) return [];
  const ids = ((await kv.get<string[]>(suiteIndexKey(stationId))) ?? []).slice(0, limit);
  if (ids.length === 0) return [];
  const pipeline = kv.pipeline();
  for (const id of ids) pipeline.get(attemptKey(id));
  const rows = await pipeline.exec<(StationSearchAttempt | null)[]>();
  return rows.filter((r): r is StationSearchAttempt => Boolean(r));
}

/** Strategies that recently failed/emptied for this station (last 14 days). */
export async function recentlyExhaustedStrategies(stationId: string): Promise<Set<string>> {
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const attempts = await listSearchAttemptsForStation(stationId, 80);
  const exhausted = new Set<string>();
  for (const a of attempts) {
    if (Date.parse(a.completedAt) < cutoff) continue;
    if (a.status === 'empty' || a.status === 'error') {
      exhausted.add(`${a.strategy}::${a.query.toLowerCase()}`);
    }
  }
  return exhausted;
}
