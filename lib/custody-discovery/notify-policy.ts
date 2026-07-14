/**
 * Email policy for custody discovery.
 *
 * Goal: AI auto-publish/auto-reject clears the queue; humans only hear about
 * material backlog or real activity — never one-off nag emails.
 */

/** Minimum findings before any "please review" email is sent (blocks single-item nags). */
export function minReviewEmailCount(): number {
  const n = Number(process.env.CUSTODY_REVIEW_EMAIL_MIN_COUNT ?? 2);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 2;
}

/** Higher bar before leftover "still needs review" notes appear in auto-approve digests. */
export function minManualPreviewEmailCount(): number {
  const n = Number(process.env.CUSTODY_MANUAL_PREVIEW_EMAIL_MIN_COUNT ?? 5);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 5;
}

/** Auto-approve digest sends only when something was published, or rejects ≥ this. */
export function minAutoRejectEmailCount(): number {
  const n = Number(process.env.CUSTODY_AUTO_REJECT_EMAIL_MIN_COUNT ?? 3);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 3;
}

export function shouldSendAutoApproveDigest(opts: {
  publishedCount: number;
  autoRejectedLast24h: number;
  needsManualReview: number;
}): { send: boolean; reason?: string } {
  if (opts.publishedCount > 0) return { send: true };
  if (opts.autoRejectedLast24h >= minAutoRejectEmailCount()) return { send: true };
  // Never email solely for a small leftover review queue — AI handles it next cron.
  if (opts.needsManualReview >= minManualPreviewEmailCount()) return { send: true };
  return {
    send: false,
    reason:
      opts.needsManualReview > 0
        ? 'below_review_email_threshold'
        : 'nothing_to_report',
  };
}

export function shouldSendOutstandingDigest(opts: {
  total: number;
  conflicts: number;
}): { send: boolean; reason?: string } {
  if (opts.total === 0) return { send: false, reason: 'nothing_outstanding' };
  // Conflicts always matter, but still batch single-conflict noise.
  if (opts.conflicts >= minReviewEmailCount()) return { send: true };
  if (opts.total >= minReviewEmailCount()) return { send: true };
  return { send: false, reason: 'below_review_email_threshold' };
}

export function shouldSendManualDiscoveryDigest(findingCount: number): {
  send: boolean;
  reason?: string;
} {
  if (findingCount <= 0) return { send: false, reason: 'no_findings' };
  if (findingCount >= minReviewEmailCount()) return { send: true };
  return { send: false, reason: 'below_review_email_threshold' };
}
