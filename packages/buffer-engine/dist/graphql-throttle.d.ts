/**
 * Serialise Buffer GraphQL calls and cap 429 backoff so morning crons
 * do not stampede one token or burn the whole Vercel maxDuration on retries.
 */
export declare function sleep(ms: number): Promise<void>;
export declare function isRateLimitMessage(message: string): boolean;
export declare function rateLimitBackoffMs(attempt: number, retryAfterMs: number | null): number;
/** Mark a shared cooldown so subsequent callers wait before hitting Buffer again. */
export declare function noteBufferRateLimit(waitMs: number): void;
/**
 * Run fn exclusively with a minimum gap between Buffer API calls.
 * Concurrent cron invocations in the same isolate queue instead of parallel 429s.
 */
export declare function withBufferApiSlot<T>(fn: () => Promise<T>): Promise<T>;
export declare const BUFFER_GRAPHQL_MAX_RETRIES = 3;
/** Test-only reset so unit tests do not leak cooldown across cases. */
export declare function resetBufferGraphqlThrottleForTests(): void;
//# sourceMappingURL=graphql-throttle.d.ts.map