/**
 * Exactly one consolidated administrator email per London day at ~07:00.
 */
import { Resend } from 'resend';
import { operatorNotifyFromAddress } from '../outreach/from-address';
import { newJobRunId, saveJobRun } from '../job-runs';
import { buildConsolidatedDailyReport } from './build-daily-report';
import {
  claimDailyReportSlot,
  DAILY_REPORT_TYPE,
  getDailyReportRun,
  hashReportPayload,
  markDailyReportFailed,
  markDailyReportSent,
  saveDailyReportRun,
  type DailyReportRunRecord,
} from './daily-report-audit';
import { formatDailyReportHtml, formatDailyReportSubject, formatDailyReportText } from './format-daily-report';
import { isLondon0700Hour, londonDateString, previousLondonDate } from './period';

export function outreachAdminEmail(): string {
  return (
    process.env.OUTREACH_ADMIN_EMAIL?.trim() ||
    process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() ||
    process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
    process.env.OWNER_EMAIL?.trim() ||
    process.env.ADMIN_EMAILS?.split(/[,;]/)[0]?.trim() ||
    ''
  );
}

export interface SendDailyReportResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  reportDate?: string;
  providerMessageId?: string;
  alreadySent?: boolean;
  acceptedTotal?: number;
}

export async function sendConsolidatedDailyReport(opts?: {
  now?: Date;
  /** Bypass London 07:00 hour gate (tests / manual ops). */
  force?: boolean;
  /** Retry the same report_date without requiring a new claim if prior send failed. */
  retryFailed?: boolean;
}): Promise<SendDailyReportResult> {
  const now = opts?.now ?? new Date();
  const runId = newJobRunId('daily_report');
  const started = now.toISOString();

  if (!opts?.force && !isLondon0700Hour(now)) {
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'daily_report',
      started,
      finished: new Date().toISOString(),
      status: 'skipped',
      errorSummary: 'not_0700_london',
    });
    return { ok: true, skipped: true, reason: 'not_0700_london' };
  }

  const recipient = outreachAdminEmail();
  if (!recipient) {
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'daily_report',
      started,
      finished: new Date().toISOString(),
      status: 'failed',
      errorSummary: 'OUTREACH_ADMIN_EMAIL (or FIRM_OUTREACH_DIGEST_EMAIL) not configured',
    });
    return {
      ok: false,
      reason: 'OUTREACH_ADMIN_EMAIL (or FIRM_OUTREACH_DIGEST_EMAIL) not configured',
    };
  }

  // Report covers previous London day; idempotency key is the morning's London date.
  const morningDate = londonDateString(now);
  const periodDate = previousLondonDate(now);

  const existing = await getDailyReportRun(morningDate);
  if (existing?.emailStatus === 'sent' && existing.providerMessageId) {
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'daily_report',
      started,
      finished: new Date().toISOString(),
      status: 'skipped',
      accepted: existing.totalAcceptedCount,
      errorSummary: 'already_sent',
      meta: { providerMessageId: existing.providerMessageId },
    });
    return {
      ok: true,
      skipped: true,
      alreadySent: true,
      reason: 'already_sent',
      reportDate: morningDate,
      providerMessageId: existing.providerMessageId,
      acceptedTotal: existing.totalAcceptedCount,
    };
  }

  const canRetry =
    opts?.retryFailed &&
    existing &&
    (existing.emailStatus === 'failed' || existing.emailStatus === 'retrying');

  if (!canRetry) {
    const claimed = await claimDailyReportSlot(morningDate);
    if (!claimed && !existing) {
      // Another worker won the claim — treat as in-flight / already handled.
      const raced = await getDailyReportRun(morningDate);
      if (raced?.emailStatus === 'sent') {
        return {
          ok: true,
          skipped: true,
          alreadySent: true,
          reason: 'already_sent',
          reportDate: morningDate,
          providerMessageId: raced.providerMessageId,
        };
      }
      return { ok: true, skipped: true, reason: 'claim_lost', reportDate: morningDate };
    }
    if (!claimed && existing?.emailStatus === 'sent') {
      return {
        ok: true,
        skipped: true,
        alreadySent: true,
        reason: 'already_sent',
        reportDate: morningDate,
        providerMessageId: existing.providerMessageId,
      };
    }
  }

  const report = await buildConsolidatedDailyReport(now);
  const payloadHash = hashReportPayload({
    date: report.date,
    psaAccepted: report.psa.emailsAcceptedByProvider,
    repukAccepted: report.repuk.emailsAcceptedByProvider,
    recipients: [
      ...report.psa.recipients.map((r) => r.providerMessageId),
      ...report.repuk.recipients.map((r) => r.providerMessageId),
    ],
  });

  const record: DailyReportRunRecord = {
    id: existing?.id ?? `drr_${morningDate}`,
    reportDate: morningDate,
    reportType: DAILY_REPORT_TYPE,
    reportingPeriodStart: report.reportingPeriodStart,
    reportingPeriodEnd: report.reportingPeriodEnd,
    workspaceAgentStatus: report.psa.status,
    workspaceRepukStatus: report.repuk.status,
    agentAcceptedCount: report.psa.emailsAcceptedByProvider,
    repukAcceptedCount: report.repuk.emailsAcceptedByProvider,
    totalAcceptedCount: report.totals.accepted,
    recipientCount: report.psa.recipients.length + report.repuk.recipients.length,
    reportPayloadHash: payloadHash,
    recipient,
    emailStatus: 'pending',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await saveDailyReportRun(record);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    await markDailyReportFailed({ reportDate: morningDate, error: 'RESEND_API_KEY missing' });
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'daily_report',
      started,
      finished: new Date().toISOString(),
      status: 'failed',
      errorSummary: 'RESEND_API_KEY missing',
    });
    return { ok: false, reason: 'RESEND_API_KEY missing', reportDate: morningDate };
  }

  const subject = formatDailyReportSubject(report);
  const html = formatDailyReportHtml(report);
  const text = formatDailyReportText(report);

  try {
    const client = new Resend(apiKey);
    const result = await client.emails.send({
      from: operatorNotifyFromAddress(),
      to: recipient,
      subject,
      html,
      text,
    });
    const providerMessageId =
      (result as { data?: { id?: string } })?.data?.id ||
      (result as { id?: string })?.id ||
      '';

    if (!providerMessageId) {
      throw new Error('Resend accepted request but returned no message id');
    }

    await markDailyReportSent({ reportDate: morningDate, providerMessageId });
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'daily_report',
      started,
      finished: new Date().toISOString(),
      status: 'success',
      accepted: report.totals.accepted,
      meta: {
        providerMessageId,
        periodDate,
        morningDate,
        payloadHash,
      },
    });

    return {
      ok: true,
      reportDate: morningDate,
      providerMessageId,
      acceptedTotal: report.totals.accepted,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markDailyReportFailed({ reportDate: morningDate, error: message });
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'daily_report',
      started,
      finished: new Date().toISOString(),
      status: 'failed',
      errorSummary: message.slice(0, 500),
    });
    return { ok: false, reason: message, reportDate: morningDate };
  }
}
