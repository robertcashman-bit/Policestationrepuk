"use strict";
/**
 * Serialise Buffer GraphQL calls and cap 429 backoff so morning crons
 * do not stampede one token or burn the whole Vercel maxDuration on retries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUFFER_GRAPHQL_MAX_RETRIES = void 0;
exports.sleep = sleep;
exports.isRateLimitMessage = isRateLimitMessage;
exports.rateLimitBackoffMs = rateLimitBackoffMs;
exports.noteBufferRateLimit = noteBufferRateLimit;
exports.withBufferApiSlot = withBufferApiSlot;
exports.resetBufferGraphqlThrottleForTests = resetBufferGraphqlThrottleForTests;
const MIN_GAP_MS = 300;
const GRAPHQL_MAX_RETRIES = 3;
const MAX_BACKOFF_MS = 8000;
let chain = Promise.resolve();
let lastCallAt = 0;
let cooldownUntil = 0;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRateLimitMessage(message) {
    return /too many requests|rate limit|429|throttl/i.test(message);
}
function rateLimitBackoffMs(attempt, retryAfterMs) {
    if (retryAfterMs && retryAfterMs > 0) {
        return Math.min(MAX_BACKOFF_MS, retryAfterMs);
    }
    return Math.min(MAX_BACKOFF_MS, 750 * 2 ** attempt);
}
/** Mark a shared cooldown so subsequent callers wait before hitting Buffer again. */
function noteBufferRateLimit(waitMs) {
    cooldownUntil = Math.max(cooldownUntil, Date.now() + Math.min(MAX_BACKOFF_MS, waitMs));
}
/**
 * Run fn exclusively with a minimum gap between Buffer API calls.
 * Concurrent cron invocations in the same isolate queue instead of parallel 429s.
 */
async function withBufferApiSlot(fn) {
    let release;
    const gate = new Promise((resolve) => {
        release = resolve;
    });
    const prev = chain;
    chain = prev.then(() => gate);
    await prev;
    try {
        const now = Date.now();
        const wait = Math.max(0, cooldownUntil - now, MIN_GAP_MS - (now - lastCallAt));
        if (wait > 0)
            await sleep(wait);
        lastCallAt = Date.now();
        return await fn();
    }
    finally {
        release();
    }
}
exports.BUFFER_GRAPHQL_MAX_RETRIES = GRAPHQL_MAX_RETRIES;
/** Test-only reset so unit tests do not leak cooldown across cases. */
function resetBufferGraphqlThrottleForTests() {
    chain = Promise.resolve();
    lastCallAt = 0;
    cooldownUntil = 0;
}
