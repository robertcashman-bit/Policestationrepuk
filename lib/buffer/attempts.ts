import { getKV } from '@/lib/kv';

export type BufferAttemptOutcome =
  | 'accepted'
  | 'failed'
  | 'duplicate'
  | 'skipped_invalid_attachment'
  | 'rate_limited';

export interface BufferAttemptRecord {
  id: string;
  jobRunId: string;
  siteId: string;
  date: string;
  slug: string;
  feedId: string;
  channelId: string;
  channelService: string;
  dueAt: string | null;
  outcome: BufferAttemptOutcome;
  externalPostId?: string;
  errorCode?: string;
  errorMessage?: string;
  attemptNumber: number;
  durationMs: number;
  createdAt: string;
}

const ATTEMPTS_KEY = (siteId: string, date: string) => `buffer-attempts:${siteId}:${date}`;
const TTL_SECONDS = 45 * 24 * 60 * 60;

function sanitiseError(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [REDACTED]')
    .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=[REDACTED]')
    .slice(0, 500);
}

export async function appendBufferAttempt(
  record: Omit<BufferAttemptRecord, 'id' | 'createdAt'> & { id?: string },
): Promise<BufferAttemptRecord> {
  const full: BufferAttemptRecord = {
    ...record,
    id: record.id ?? `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    errorMessage: record.errorMessage ? sanitiseError(record.errorMessage) : undefined,
    createdAt: new Date().toISOString(),
  };

  const kv = getKV();
  if (!kv) {
    console.info('[buffer:attempts]', JSON.stringify({ ...full, event: 'buffer_attempt' }));
    return full;
  }

  const key = ATTEMPTS_KEY(record.siteId, record.date);
  const existing = (await kv.get<BufferAttemptRecord[]>(key)) ?? [];
  existing.push(full);
  const trimmed = existing.slice(-200);
  await kv.set(key, trimmed, { ex: TTL_SECONDS });
  return full;
}

export async function listBufferAttempts(siteId: string, date: string): Promise<BufferAttemptRecord[]> {
  const kv = getKV();
  if (!kv) return [];
  return (await kv.get<BufferAttemptRecord[]>(ATTEMPTS_KEY(siteId, date))) ?? [];
}

export interface BufferBatchSummary {
  siteId: string;
  date: string;
  expected: number;
  attempted: number;
  accepted: number;
  failed: number;
  duplicates: number;
  skippedInvalidAttachment: number;
  rateLimited: number;
  complete: boolean;
}

export function summariseAttempts(
  siteId: string,
  date: string,
  attempts: BufferAttemptRecord[],
  expected: number,
): BufferBatchSummary {
  const accepted = attempts.filter((a) => a.outcome === 'accepted').length;
  const failed = attempts.filter((a) => a.outcome === 'failed').length;
  const duplicates = attempts.filter((a) => a.outcome === 'duplicate').length;
  const skippedInvalidAttachment = attempts.filter(
    (a) => a.outcome === 'skipped_invalid_attachment',
  ).length;
  const rateLimited = attempts.filter((a) => a.outcome === 'rate_limited').length;
  return {
    siteId,
    date,
    expected,
    attempted: attempts.length,
    accepted,
    failed,
    duplicates,
    skippedInvalidAttachment,
    rateLimited,
    complete: accepted >= expected,
  };
}

