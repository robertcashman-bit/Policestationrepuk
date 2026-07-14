import { afterEach, describe, expect, it } from 'vitest';
import {
  shouldSendAutoApproveDigest,
  shouldSendManualDiscoveryDigest,
  shouldSendOutstandingDigest,
} from '@/lib/custody-discovery/notify-policy';

describe('custody notify policy', () => {
  afterEach(() => {
    delete process.env.CUSTODY_REVIEW_EMAIL_MIN_COUNT;
    delete process.env.CUSTODY_AUTO_REJECT_EMAIL_MIN_COUNT;
  });

  it('sends auto-approve digest when something was published', () => {
    expect(
      shouldSendAutoApproveDigest({
        publishedCount: 1,
        autoRejectedLast24h: 0,
        needsManualReview: 0,
      }).send,
    ).toBe(true);
  });

  it('does not email for a single leftover review item', () => {
    const result = shouldSendAutoApproveDigest({
      publishedCount: 0,
      autoRejectedLast24h: 0,
      needsManualReview: 1,
    });
    expect(result.send).toBe(false);
    expect(result.reason).toBe('below_review_email_threshold');
  });

  it('emails auto-approve digest when leftover manual review is large', () => {
    expect(
      shouldSendAutoApproveDigest({
        publishedCount: 0,
        autoRejectedLast24h: 0,
        needsManualReview: 5,
      }).send,
    ).toBe(true);
  });

  it('does not send outstanding digests for a single finding', () => {
    expect(
      shouldSendOutstandingDigest({ total: 1, conflicts: 0 }).send,
    ).toBe(false);
  });

  it('sends outstanding digests once two or more are waiting', () => {
    expect(
      shouldSendOutstandingDigest({ total: 2, conflicts: 0 }).send,
    ).toBe(true);
  });

  it('does not send manual discovery digests for a single finding', () => {
    expect(shouldSendManualDiscoveryDigest(1).send).toBe(false);
    expect(shouldSendManualDiscoveryDigest(2).send).toBe(true);
  });
});
