/**
 * Daily discovery summary metrics for observability / alerting.
 */

import { getAllFindings, loadAllApprovedNumbers } from './storage';
import { saveCronRunLog } from '@/lib/cron-run-log';
import { getKV } from '@/lib/kv';

export interface DiscoveryDailySummary {
  date: string;
  stationsWithFindings: number;
  openFindings: number;
  approvedVisible: number;
  createdLast24h: number;
  approvedLast24h: number;
  rejectedLast24h: number;
  conflicting: number;
  general101Open: number;
  switchboardOpen: number;
  needsReview: number;
  weakEvidenceApproves: number;
  duplicateNormalizedAcrossSuites: number;
  previousCreatedLast24h: number | null;
  alertFlags: string[];
}

const SUMMARY_KEY = 'custodydiscovery:daily-summary:latest';

function sinceIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export async function buildDiscoveryDailySummary(now = new Date()): Promise<DiscoveryDailySummary> {
  const findings = await getAllFindings();
  const approvedMap = await loadAllApprovedNumbers();
  const approved = [...approvedMap.values()];
  const dayAgo = sinceIso(24);

  const open = findings.filter((f) => f.status === 'new' || f.status === 'needs_review');
  const createdLast24h = findings.filter((f) => f.dateFound >= dayAgo).length;
  const rejectedLast24h = findings.filter(
    (f) => f.status === 'rejected' && f.updatedAt >= dayAgo,
  ).length;
  const approvedLast24h = approved.filter((a) => a.approvedAt >= dayAgo).length;

  const byNumber = new Map<string, Set<string>>();
  for (const f of findings) {
    if (f.status === 'rejected') continue;
    const set = byNumber.get(f.normalizedPhoneNumber) ?? new Set();
    set.add(f.custodySuiteId);
    byNumber.set(f.normalizedPhoneNumber, set);
  }
  let duplicateNormalizedAcrossSuites = 0;
  for (const set of byNumber.values()) {
    if (set.size >= 5) duplicateNormalizedAcrossSuites++;
  }

  const kv = getKV();
  const previous = kv ? await kv.get<DiscoveryDailySummary>(SUMMARY_KEY) : null;

  const alertFlags: string[] = [];
  if (createdLast24h === 0 && open.length > 50) {
    alertFlags.push('zero_new_findings_with_backlog');
  }
  if (previous && previous.createdLast24h > 10 && createdLast24h < previous.createdLast24h * 0.25) {
    alertFlags.push('abnormal_drop_in_results');
  }
  const general101Open = open.filter((f) => f.classification === 'general_101').length;
  if (general101Open > 40) alertFlags.push('high_101_open_findings');
  if (duplicateNormalizedAcrossSuites > 15) alertFlags.push('high_shared_number_clusters');

  const summary: DiscoveryDailySummary = {
    date: now.toISOString().slice(0, 10),
    stationsWithFindings: new Set(findings.map((f) => f.custodySuiteId)).size,
    openFindings: open.length,
    approvedVisible: approved.filter((a) => a.publicVisible).length,
    createdLast24h,
    approvedLast24h,
    rejectedLast24h,
    conflicting: findings.filter((f) => Boolean(f.conflictReason) && f.status !== 'rejected').length,
    general101Open,
    switchboardOpen: open.filter((f) => f.classification === 'switchboard').length,
    needsReview: findings.filter((f) => f.status === 'needs_review').length,
    weakEvidenceApproves: findings.filter(
      (f) =>
        f.aiReview?.recommendation === 'approve' &&
        f.aiReview.evidence.source !== 'page_fetch' &&
        f.aiReview.evidence.source !== 'pdf_fetch',
    ).length,
    duplicateNormalizedAcrossSuites,
    previousCreatedLast24h: previous?.createdLast24h ?? null,
    alertFlags,
  };

  if (kv) {
    await kv.set(SUMMARY_KEY, summary, { ex: 60 * 60 * 24 * 14 });
  }

  return summary;
}

export async function runDiscoveryDailySummaryJob(): Promise<DiscoveryDailySummary> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const summary = await buildDiscoveryDailySummary();
  await saveCronRunLog({
    jobName: 'station-phone-discovery-summary',
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    outcome: 'success',
    counts: {
      createdLast24h: summary.createdLast24h,
      openFindings: summary.openFindings,
      approvedVisible: summary.approvedVisible,
      alertFlags: summary.alertFlags.length,
    },
    errorCategory: summary.alertFlags.length ? 'discovery_alerts' : undefined,
    errorMessage: summary.alertFlags.length ? summary.alertFlags.join(',') : undefined,
  });
  if (summary.alertFlags.length) {
    console.warn('[station-phone-discovery-summary] alerts:', summary.alertFlags.join(', '));
  }
  return summary;
}
