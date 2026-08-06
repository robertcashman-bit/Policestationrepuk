/** Default when env unset — conservative free-tier shaped ceiling. */
export const DEFAULT_RESEND_DAILY_LIMIT = 100;

/** Headroom reserved for login codes, digests, Kent corrections, etc. */
export const DEFAULT_RESEND_HEADROOM = 10;

export const RESEND_COUNT_KEY_PREFIX = 'firmoutreach:resend:count:';

export function resendQuotaKey(utcDate: string): string {
  return `${RESEND_COUNT_KEY_PREFIX}${utcDate}`;
}

function parseUnlimitedOrNumber(raw: string | undefined, fallback: number): number {
  if (
    raw === undefined ||
    raw === '' ||
    ['0', 'off', 'none', 'unlimited', 'false', 'no'].includes(raw.toLowerCase())
  ) {
    // Explicit unlimited markers → no soft Resend budget (paid plans).
    // Unset still uses fallback so free-tier defaults stay safe.
    if (raw === undefined || raw === '') return fallback;
    return Number.MAX_SAFE_INTEGER;
  }
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return fallback;
}

/**
 * Soft Resend daily ceiling for outreach accounting.
 * Set FIRM_OUTREACH_RESEND_DAILY_LIMIT=unlimited (or 0/off) on paid plans with no daily quota.
 */
export function resendDailyLimit(): number {
  return parseUnlimitedOrNumber(
    process.env.FIRM_OUTREACH_RESEND_DAILY_LIMIT?.trim(),
    DEFAULT_RESEND_DAILY_LIMIT,
  );
}

export function isResendDailyLimitUnlimited(limit = resendDailyLimit()): boolean {
  return limit >= Number.MAX_SAFE_INTEGER;
}

export function resendDailyHeadroom(): number {
  if (isResendDailyLimitUnlimited()) return 0;
  return (
    Number(process.env.FIRM_OUTREACH_RESEND_HEADROOM ?? DEFAULT_RESEND_HEADROOM) ||
    DEFAULT_RESEND_HEADROOM
  );
}

/** Effective outreach budget across both sites for a UTC day. */
export function resendOutreachBudget(): number {
  return Math.max(0, resendDailyLimit() - resendDailyHeadroom());
}

export function resendQuotaRemaining(count: number): number {
  return Math.max(0, resendOutreachBudget() - count);
}

import { classifyProviderError } from './email-jobs';

export function isTransientResendError(error?: string, statusCode?: number): boolean {
  return classifyProviderError(error, statusCode) === 'transient';
}

export function isPermanentResendError(error?: string, statusCode?: number): boolean {
  return classifyProviderError(error, statusCode) === 'permanent';
}
