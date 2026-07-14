import { describe, expect, it } from 'vitest';
import {
  classifyBufferError,
  isDuplicateBufferError,
  isRetryableBufferError,
  nextRetryAt,
  bufferRetryDelayMs,
} from '@/lib/buffer/errors';
import { summariseAttempts, type BufferAttemptRecord } from '@/lib/buffer/attempts';
import { normaliseAttachmentUrl } from '@/lib/buffer/attachment-validation';

describe('classifyBufferError', () => {
  it('classifies rate limits as rate_limit', () => {
    const c = classifyBufferError(new Error('Too many requests from this client'));
    expect(c.class).toBe('rate_limit');
    expect(c.retryAfterMs).toBeGreaterThan(0);
  });

  it('classifies duplicates', () => {
    expect(isDuplicateBufferError(new Error('already got this one scheduled'))).toBe(true);
    expect(classifyBufferError(new Error('not able to post the same thing twice')).class).toBe(
      'duplicate',
    );
  });

  it('classifies attachment/auth failures as non-retryable', () => {
    expect(classifyBufferError(new Error('GBP preflight failed')).class).toBe('non_retryable');
    expect(classifyBufferError(new Error('Unauthorized')).class).toBe('non_retryable');
    expect(classifyBufferError(new Error('file size limit exceeded')).class).toBe('non_retryable');
  });

  it('classifies timeouts as retryable', () => {
    expect(isRetryableBufferError(new Error('fetch failed: ETIMEDOUT'))).toBe(true);
    expect(classifyBufferError(new Error('HTTP 503 Service Unavailable')).class).toBe('retryable');
  });
});

describe('bufferRetryDelayMs / nextRetryAt', () => {
  it('grows with attempt and stays within max', () => {
    const d1 = bufferRetryDelayMs(1, 1000, 10_000);
    const d5 = bufferRetryDelayMs(5, 1000, 10_000);
    expect(d1).toBeGreaterThanOrEqual(1000);
    expect(d5).toBeLessThanOrEqual(10_000 + 30_000);
  });

  it('nextRetryAt uses progression table', () => {
    const from = new Date('2026-06-14T12:00:00.000Z');
    const next = nextRetryAt(0, from);
    expect(next.getTime() - from.getTime()).toBe(60_000);
  });
});

describe('summariseAttempts', () => {
  it('computes complete when accepted >= expected', () => {
    const attempts: BufferAttemptRecord[] = [
      {
        id: '1',
        jobRunId: 'j',
        siteId: 'policestationrepuk',
        date: '2026-06-14',
        slug: 'a',
        feedId: 'policestationrepuk',
        channelId: 'c1',
        channelService: 'twitter',
        dueAt: null,
        outcome: 'accepted',
        attemptNumber: 1,
        durationMs: 10,
        createdAt: '2026-06-14T12:00:00.000Z',
      },
      {
        id: '2',
        jobRunId: 'j',
        siteId: 'policestationrepuk',
        date: '2026-06-14',
        slug: 'b',
        feedId: 'policestationrepuk',
        channelId: 'c1',
        channelService: 'linkedin',
        dueAt: null,
        outcome: 'failed',
        attemptNumber: 1,
        durationMs: 10,
        createdAt: '2026-06-14T12:00:01.000Z',
      },
    ];
    const s = summariseAttempts('policestationrepuk', '2026-06-14', attempts, 2);
    expect(s.accepted).toBe(1);
    expect(s.failed).toBe(1);
    expect(s.complete).toBe(false);
  });
});

describe('normaliseAttachmentUrl', () => {
  it('rejects localhost and missing URLs', () => {
    expect(normaliseAttachmentUrl(undefined)).toBeNull();
    expect(normaliseAttachmentUrl('http://localhost:3000/x.jpg')).toBeNull();
    expect(normaliseAttachmentUrl('https://policestationrepuk.org/x.jpg')).toContain(
      'policestationrepuk.org',
    );
  });
});
