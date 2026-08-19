import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  rateLimitBackoffMs,
  resetBufferGraphqlThrottleForTests,
  BUFFER_GRAPHQL_MAX_RETRIES,
} from '@/lib/buffer/graphql-throttle';
import { listScheduledBufferPosts } from '@/lib/buffer/client';

describe('buffer graphql 429 handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetBufferGraphqlThrottleForTests();
  });

  it('caps backoff well below legacy 60s stampede sleeps', () => {
    expect(rateLimitBackoffMs(0, null)).toBeLessThanOrEqual(8_000);
    expect(rateLimitBackoffMs(5, null)).toBeLessThanOrEqual(8_000);
    expect(rateLimitBackoffMs(0, 120_000)).toBe(8_000);
    expect(BUFFER_GRAPHQL_MAX_RETRIES).toBeLessThanOrEqual(3);
  });

  it('retries GraphQL 429 with backoff then succeeds (no live Buffer)', async () => {
    vi.useFakeTimers();
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        if (calls < 3) {
          return {
            ok: false,
            status: 429,
            headers: new Headers({ 'retry-after': '1' }),
            json: async () => ({
              errors: [{ message: 'Too many requests from this client.' }],
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            data: {
              posts: {
                edges: [],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
            },
          }),
        };
      }),
    );

    const pending = listScheduledBufferPosts('test-key', 'org', {
      dueAtStart: '2026-08-18T00:00:00+01:00',
      dueAtEnd: '2026-08-19T00:00:00+01:00',
    });
    await vi.runAllTimersAsync();
    const posts = await pending;
    expect(posts).toEqual([]);
    expect(calls).toBe(3);
  });
});
