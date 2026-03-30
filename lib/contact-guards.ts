/**
 * Lightweight anti-abuse for the public contact form (best-effort on serverless).
 */

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;
const buckets = new Map<string, number[]>();

export function getClientIp(request: Request): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

/** Returns true if this IP may submit (under the rolling limit). */
export function contactRateLimitOk(ip: string): boolean {
  const now = Date.now();
  const prev = (buckets.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (prev.length >= RATE_MAX) return false;
  prev.push(now);
  buckets.set(ip, prev);
  if (buckets.size > 50_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t > RATE_WINDOW_MS)) buckets.delete(k);
    }
  }
  return true;
}

const MIN_ELAPSED_MS = 2_500;
const MAX_FORM_AGE_MS = 48 * 60 * 60 * 1000;
const MAX_LINKISH = 8;

export type ContactTimingResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export function validateContactTiming(_startedAt: unknown): ContactTimingResult {
  const t = typeof _startedAt === 'number' ? _startedAt : Number(_startedAt);
  if (!Number.isFinite(t) || t <= 0) {
    return { ok: false, error: 'Please reload the page and try again.', status: 400 };
  }
  const now = Date.now();
  const elapsed = now - t;
  if (elapsed < MIN_ELAPSED_MS) {
    return {
      ok: false,
      error: 'Please wait a moment before sending — then try again.',
      status: 429,
    };
  }
  if (elapsed > MAX_FORM_AGE_MS) {
    return {
      ok: false,
      error: 'This form session has expired. Please refresh the page and try again.',
      status: 400,
    };
  }
  return { ok: true };
}

export function countLinkLikeSegments(text: string): number {
  const m = text.match(/https?:\/\/[^\s]+|www\.[^\s]+/gi);
  return m ? m.length : 0;
}

export function messageLooksSpammy(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 3) return true;
  if (countLinkLikeSegments(message) > MAX_LINKISH) return true;
  const unique = new Set(trimmed.toLowerCase().replace(/\s+/g, ''));
  if (trimmed.length > 40 && unique.size < 6) return true;
  return false;
}
