/**
 * Buffer error classification — retryable vs non-retryable until corrected.
 */
export type BufferErrorClass = 'retryable' | 'non_retryable' | 'duplicate' | 'rate_limit';

export interface ClassifiedBufferError {
  class: BufferErrorClass;
  code: string;
  message: string;
  retryAfterMs?: number;
}

const DUPLICATE_RE =
  /posted that one recently|already got this one scheduled|not able to post the same thing twice/i;

const RATE_LIMIT_RE = /too many requests|rate.?limit|429/i;

const RETRYABLE_RE =
  /timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|network|fetch failed|408|500|502|503|504|temporar|unavailable|try again later/i;

const NON_RETRYABLE_RE =
  /unauthorized|invalid.*(channel|profile|image|input|token)|unsupported (content-type|media)|permission|forbidden|file size limit|magic-byte|gbp preflight|requires a blog image|no google business|malformed|missing required/i;

export function classifyBufferError(err: unknown, retryAfterHeader?: string | null): ClassifiedBufferError {
  const message = err instanceof Error ? err.message : String(err);

  if (DUPLICATE_RE.test(message)) {
    return { class: 'duplicate', code: 'duplicate_content', message };
  }

  if (RATE_LIMIT_RE.test(message)) {
    const retryAfterMs = parseRetryAfterMs(retryAfterHeader) ?? 60_000;
    return { class: 'rate_limit', code: 'rate_limit', message, retryAfterMs };
  }

  if (NON_RETRYABLE_RE.test(message)) {
    return { class: 'non_retryable', code: 'validation_or_auth', message };
  }

  if (RETRYABLE_RE.test(message)) {
    return { class: 'retryable', code: 'transient', message };
  }

  // Default: treat as non-retryable until inspected — avoids duplicate storm on unknown errors
  return { class: 'non_retryable', code: 'unknown', message };
}

export function isRetryableBufferError(err: unknown): boolean {
  const c = classifyBufferError(err).class;
  return c === 'retryable' || c === 'rate_limit';
}

export function isDuplicateBufferError(err: unknown): boolean {
  return classifyBufferError(err).class === 'duplicate';
}

/** Exponential backoff with jitter. attempt is 1-based. */
export function bufferRetryDelayMs(attempt: number, baseMs = 60_000, maxMs = 12 * 60 * 60 * 1000): number {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(30_000, exp * 0.2));
  return exp + jitter;
}

/** Suggested progression: 1m, 5m, 15m, 1h, 4h, 12h */
export const BUFFER_RETRY_SCHEDULE_MS = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  4 * 60 * 60_000,
  12 * 60 * 60_000,
] as const;

export function nextRetryAt(attemptCount: number, from = new Date()): Date {
  const idx = Math.min(attemptCount, BUFFER_RETRY_SCHEDULE_MS.length - 1);
  const delay = BUFFER_RETRY_SCHEDULE_MS[Math.max(0, idx)]!;
  return new Date(from.getTime() + delay);
}

function parseRetryAfterMs(header?: string | null): number | undefined {
  if (!header?.trim()) return undefined;
  const asInt = Number(header);
  if (Number.isFinite(asInt) && asInt >= 0) return asInt * 1000;
  const asDate = Date.parse(header);
  if (Number.isFinite(asDate)) return Math.max(0, asDate - Date.now());
  return undefined;
}
