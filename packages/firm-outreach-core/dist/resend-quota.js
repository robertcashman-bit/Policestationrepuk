"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESEND_COUNT_KEY_PREFIX = exports.DEFAULT_RESEND_HEADROOM = exports.DEFAULT_RESEND_DAILY_LIMIT = void 0;
exports.resendQuotaKey = resendQuotaKey;
exports.resendDailyLimit = resendDailyLimit;
exports.isResendDailyLimitUnlimited = isResendDailyLimitUnlimited;
exports.resendDailyHeadroom = resendDailyHeadroom;
exports.resendOutreachBudget = resendOutreachBudget;
exports.resendQuotaRemaining = resendQuotaRemaining;
exports.isTransientResendError = isTransientResendError;
exports.isPermanentResendError = isPermanentResendError;
/** Default when env unset — conservative free-tier shaped ceiling. */
exports.DEFAULT_RESEND_DAILY_LIMIT = 100;
/** Headroom reserved for login codes, digests, Kent corrections, etc. */
exports.DEFAULT_RESEND_HEADROOM = 10;
exports.RESEND_COUNT_KEY_PREFIX = 'firmoutreach:resend:count:';
function resendQuotaKey(utcDate) {
    return `${exports.RESEND_COUNT_KEY_PREFIX}${utcDate}`;
}
function parseUnlimitedOrNumber(raw, fallback) {
    if (raw === undefined ||
        raw === '' ||
        ['0', 'off', 'none', 'unlimited', 'false', 'no'].includes(raw.toLowerCase())) {
        // Explicit unlimited markers → no soft Resend budget (paid plans).
        // Unset still uses fallback so free-tier defaults stay safe.
        if (raw === undefined || raw === '')
            return fallback;
        return Number.MAX_SAFE_INTEGER;
    }
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0)
        return Math.floor(n);
    return fallback;
}
/**
 * Soft Resend daily ceiling for outreach accounting.
 * Set FIRM_OUTREACH_RESEND_DAILY_LIMIT=unlimited (or 0/off) on paid plans with no daily quota.
 */
function resendDailyLimit() {
    return parseUnlimitedOrNumber(process.env.FIRM_OUTREACH_RESEND_DAILY_LIMIT?.trim(), exports.DEFAULT_RESEND_DAILY_LIMIT);
}
function isResendDailyLimitUnlimited(limit = resendDailyLimit()) {
    return limit >= Number.MAX_SAFE_INTEGER;
}
function resendDailyHeadroom() {
    if (isResendDailyLimitUnlimited())
        return 0;
    return (Number(process.env.FIRM_OUTREACH_RESEND_HEADROOM ?? exports.DEFAULT_RESEND_HEADROOM) ||
        exports.DEFAULT_RESEND_HEADROOM);
}
/** Effective outreach budget across both sites for a UTC day. */
function resendOutreachBudget() {
    return Math.max(0, resendDailyLimit() - resendDailyHeadroom());
}
function resendQuotaRemaining(count) {
    return Math.max(0, resendOutreachBudget() - count);
}
const email_jobs_1 = require("./email-jobs");
function isTransientResendError(error, statusCode) {
    return (0, email_jobs_1.classifyProviderError)(error, statusCode) === 'transient';
}
function isPermanentResendError(error, statusCode) {
    return (0, email_jobs_1.classifyProviderError)(error, statusCode) === 'permanent';
}
