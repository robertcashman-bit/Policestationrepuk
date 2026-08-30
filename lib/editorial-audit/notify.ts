import {
  addToDailyAuditBucket,
  dailyAuditDate,
  getDailyAuditBucket,
  markDailyAuditSent,
  shouldSendDailyAudit,
} from './daily-notify';
import { sendEditorialAuditDigestEmail } from './email';
import type { AuditFinding } from './types';

export interface AuditNotifyResult {
  emailed: boolean;
  findingCount: number;
  pendingDailyDigest: boolean;
  dailyDigestDate?: string;
}

export async function notifyIfFindings(
  findings: AuditFinding[],
  unitsScanned: number,
  extras?: { extraHtml?: string; prUrl?: string; prError?: string },
): Promise<AuditNotifyResult> {
  const today = dailyAuditDate();

  if (findings.length === 0) {
    return {
      emailed: false,
      findingCount: 0,
      pendingDailyDigest: false,
      dailyDigestDate: today,
    };
  }

  const bucket = await addToDailyAuditBucket(today, findings, unitsScanned);
  const existing = await getDailyAuditBucket(today);

  if (existing?.notifiedAt) {
    return {
      emailed: false,
      findingCount: bucket.findings.length,
      pendingDailyDigest: false,
      dailyDigestDate: today,
    };
  }

  if (!shouldSendDailyAudit()) {
    return {
      emailed: false,
      findingCount: bucket.findings.length,
      pendingDailyDigest: true,
      dailyDigestDate: today,
    };
  }

  const emailed = await sendEditorialAuditDigestEmail({
    findings: bucket.findings,
    unitsScanned: bucket.unitsScanned,
    date: today,
    extraHtml: extras?.extraHtml,
    prUrl: extras?.prUrl,
    prError: extras?.prError,
  });

  if (emailed) await markDailyAuditSent(today);

  return {
    emailed,
    findingCount: bucket.findings.length,
    pendingDailyDigest: false,
    dailyDigestDate: today,
  };
}
