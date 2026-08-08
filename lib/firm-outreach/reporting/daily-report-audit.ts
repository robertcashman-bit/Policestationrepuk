/**
 * daily_report_runs equivalent (KV).
 * Idempotency: report_date + report_type.
 */
import { createHash } from 'node:crypto';
import { claimKey } from '@/lib/kv-atomic';
import { getKV } from '@/lib/kv';

export const DAILY_REPORT_TYPE = 'consolidated_0700_london';

export interface DailyReportRunRecord {
  id: string;
  reportDate: string;
  reportType: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  workspaceAgentStatus: string;
  workspaceRepukStatus: string;
  agentAcceptedCount: number;
  repukAcceptedCount: number;
  totalAcceptedCount: number;
  recipientCount: number;
  reportPayloadHash: string;
  recipient: string;
  providerMessageId?: string;
  emailStatus: 'pending' | 'sent' | 'failed' | 'retrying';
  createdAt: string;
  sentAt?: string;
  lastError?: string;
}

function auditKey(reportDate: string, reportType = DAILY_REPORT_TYPE): string {
  return `firmoutreach:daily_report:${reportType}:${reportDate}`;
}

function claimAuditKey(reportDate: string, reportType = DAILY_REPORT_TYPE): string {
  return `firmoutreach:daily_report:claim:${reportType}:${reportDate}`;
}

export function hashReportPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 40);
}

export async function getDailyReportRun(
  reportDate: string,
  reportType = DAILY_REPORT_TYPE,
): Promise<DailyReportRunRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<DailyReportRunRecord>(auditKey(reportDate, reportType))) ?? null;
}

/** Claim exclusive right to send today's report. */
export async function claimDailyReportSlot(
  reportDate: string,
  reportType = DAILY_REPORT_TYPE,
): Promise<boolean> {
  return claimKey(claimAuditKey(reportDate, reportType), 60 * 60 * 24 * 3);
}

export async function saveDailyReportRun(record: DailyReportRunRecord): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(auditKey(record.reportDate, record.reportType), record, {
    ex: 60 * 60 * 24 * 90,
  });
  await kv.set('firmoutreach:daily_report:latest', record, { ex: 60 * 60 * 24 * 90 });
}

export async function getLatestDailyReportRun(): Promise<DailyReportRunRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<DailyReportRunRecord>('firmoutreach:daily_report:latest')) ?? null;
}

export async function markDailyReportSent(opts: {
  reportDate: string;
  providerMessageId: string;
  reportType?: string;
}): Promise<void> {
  const reportType = opts.reportType ?? DAILY_REPORT_TYPE;
  const existing = await getDailyReportRun(opts.reportDate, reportType);
  if (!existing) return;
  existing.emailStatus = 'sent';
  existing.providerMessageId = opts.providerMessageId;
  existing.sentAt = new Date().toISOString();
  existing.lastError = undefined;
  await saveDailyReportRun(existing);
}

export async function markDailyReportFailed(opts: {
  reportDate: string;
  error: string;
  reportType?: string;
}): Promise<void> {
  const reportType = opts.reportType ?? DAILY_REPORT_TYPE;
  const existing = await getDailyReportRun(opts.reportDate, reportType);
  if (!existing) return;
  existing.emailStatus = 'retrying';
  existing.lastError = opts.error.slice(0, 500);
  await saveDailyReportRun(existing);
}
