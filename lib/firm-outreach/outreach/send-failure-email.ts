import { Resend } from 'resend';
import type { OutreachRunStats } from '../types';
import { operatorNotifyFromAddress } from './from-address';
import { outreachNotifyEmail } from './notify-recipient';
import { outreachApprovalDate } from './send-approval-token';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

function escapeHtml(value: string | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface OutreachSendFailureEmailInput {
  stats: OutreachRunStats;
  readyToSend: number;
  reason: string;
  date?: string;
}

/** Skip reasons that mean "intentionally did not send" — not an outage. */
const BENIGN_SKIP_REASONS = new Set([
  'firm_cooldown',
  'daily_cap',
  'hourly_cap',
  'idempotent_exists',
  'duplicate',
  'suppressed',
  'not_qualified',
  'no_email',
  'mx_invalid',
  'quiet_hours',
  'send_disabled',
  'resend_quota',
  'not_due',
  'no_step',
]);

export function shouldAlertZeroSends(opts: {
  stats: OutreachRunStats;
  readyToSend: number;
}): boolean {
  if (opts.stats.sent > 0) return false;
  if (opts.readyToSend <= 0) return false;

  // Only alert when we actually intended to send work this run.
  const intended =
    (opts.stats.jobsCreated ?? 0) > 0 ||
    (opts.stats.jobsClaimed ?? 0) > 0 ||
    (opts.stats.queued ?? 0) > 0;
  if (!intended) return false;

  const reasons = opts.stats.skipReasons ?? {};
  const entries = Object.entries(reasons).filter(([, n]) => (n ?? 0) > 0);
  if (entries.length === 0) {
    // Queued/claimed work but nothing accepted and no skip explanation → alert.
    return true;
  }

  // If every recorded skip is benign, this is expected idle — no alert.
  return entries.some(([reason]) => !BENIGN_SKIP_REASONS.has(reason));
}

export async function sendOutreachSendFailureEmail(
  input: OutreachSendFailureEmailInput,
): Promise<boolean> {
  const to = outreachNotifyEmail();
  const date = input.date ?? outreachApprovalDate();
  const subject = `[Firm outreach] Send run had problems — ${date}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:720px;">
      <h2 style="margin:0 0 12px;">Firm outreach — send run alert</h2>
      <p style="margin:0 0 16px;padding:12px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;line-height:1.5;">
        ${escapeHtml(input.reason)}
      </p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;">
        <li><strong>Accepted (provider):</strong> ${input.stats.accepted ?? input.stats.sent}</li>
        <li><strong>Jobs created:</strong> ${input.stats.jobsCreated ?? 0}</li>
        <li><strong>Jobs claimed:</strong> ${input.stats.jobsClaimed ?? 0}</li>
        <li><strong>Retry scheduled:</strong> ${input.stats.retryScheduled ?? 0}</li>
        <li><strong>Permanently failed:</strong> ${input.stats.permanentlyFailed ?? 0}</li>
        <li><strong>Errors:</strong> ${input.stats.errors}</li>
        <li><strong>Skipped:</strong> ${input.stats.skipped}</li>
        <li><strong>Eligible / ready:</strong> ${input.readyToSend}</li>
        <li><strong>Run id:</strong> ${escapeHtml(input.stats.runId)}</li>
      </ul>
      <p style="margin:0;color:#64748b;font-size:12px;">
        <a href="https://policestationrepuk.org/admin/firm-outreach">Open admin dashboard</a>
        · Check <code>RESEND_API_KEY</code> and pause state via
        <code>/api/cron/firm-outreach-status</code>
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.warn('[firm-outreach send-failure]', subject, input.reason);
    return false;
  }

  try {
    await client.emails.send({ from: operatorNotifyFromAddress(), to, subject, html });
    return true;
  } catch (err) {
    console.warn('[firm-outreach send-failure]', err);
    return false;
  }
}

/**
 * Immediate notify ONLY for critical send-config failures.
 * Zero-send / ordinary errors / permanent-fail counts are deferred to the
 * 07:00 Europe/London consolidated daily report (and autoheal critical path).
 */
export async function maybeNotifyOutreachSendFailure(opts: {
  stats: OutreachRunStats;
  readyToSend: number;
  skipped?: boolean;
  reason?: string;
}): Promise<void> {
  if (opts.skipped) return;

  // Critical: unhealthy provider/domain config lasting across a send cycle.
  if (opts.reason) {
    const r = opts.reason.toLowerCase();
    const critical =
      r.includes('unhealthy') ||
      r.includes('not verified') ||
      r.includes('api key') ||
      r.includes('suspended') ||
      r.includes('auth');
    if (!critical) return;
    await sendOutreachSendFailureEmail({
      stats: opts.stats,
      readyToSend: opts.readyToSend,
      reason: opts.reason,
    });
    return;
  }

  // Routine zero-send / error / permanent-fail emails disabled (Phase 9/12/20).
  void shouldAlertZeroSends;
}
