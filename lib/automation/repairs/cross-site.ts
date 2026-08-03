import { verifyCrossSiteBufferPosts } from '@/lib/buffer/verify-cross-site';
import { CROSS_SITE_BUFFER_TARGETS } from '@/lib/buffer/cross-site-sites';
import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import { getAutomationConfig } from '../config';
import { canPerformLiveSideEffects } from '../env-guard';
import { buildIncidentFingerprint } from '../notifications';
import { logAutomationEvent } from '../observability';
import type { HealthIssue, RepairAction } from '../types';
import { triggerSiblingBufferSchedule } from './sibling-remote';

export interface CrossSiteRepairResult {
  ok: boolean;
  date: string;
  expected: number;
  actual: number;
  sites: Array<{
    id: string;
    hostname: string;
    sentCount: number;
    requiredCount: number;
    ok: boolean;
    issue?: string;
  }>;
  repairs: RepairAction[];
  issues: HealthIssue[];
}

/**
 * Cross-site quota check.
 * Auto-repair REPUK via local gap-fill. Sibling deficits optionally trigger that
 * site's `/api/buffer/schedule` when CROSS_SITE_REMOTE_REPAIR_ENABLED=1.
 */
export async function inspectAndRepairCrossSiteQuota(options?: {
  dryRun?: boolean;
  date?: string;
  now?: Date;
  /** Admin/ops override — attempt sibling remote repair even when flag is off. */
  forceRemoteRepair?: boolean;
}): Promise<CrossSiteRepairResult> {
  const config = getAutomationConfig();
  const dryRun = options?.dryRun ?? config.dryRun;
  const report = await verifyCrossSiteBufferPosts({
    date: options?.date,
    now: options?.now,
  });

  const expected = CROSS_SITE_BUFFER_TARGETS.reduce(
    (sum, t) => sum + (t.requiredPostsPerDay ?? 5),
    0,
  );
  const actual = report.sites.reduce((sum, s) => sum + s.sentCount, 0);
  const repairs: RepairAction[] = [];
  const issues: HealthIssue[] = [];

  const allowRemote =
    Boolean(options?.forceRemoteRepair) || config.crossSiteRemoteRepairEnabled;

  for (const site of report.sites) {
    if (site.ok) continue;

    logAutomationEvent('crosssite.quota.deficit', {
      siteId: site.id,
      sentCount: site.sentCount,
      requiredCount: site.requiredCount,
      date: report.date,
    });

    const category = site.sentCount === 0 ? 'scheduler' : 'quota_supply';
    const fingerprint = buildIncidentFingerprint({
      jobName: 'buffer-cross-site-report',
      category,
      accountOrDestination: site.id,
      scheduledDate: report.date,
    });

    if (site.id === 'policestationrepuk') {
      // REPUK: yesterday already published window — we can only ensure today is on track;
      // yesterday deficit is recorded; gap-fill applies to today's schedule.
      if (dryRun || !config.autoRepairEnabled || !canPerformLiveSideEffects()) {
        repairs.push({
          id: `crosssite-${site.id}`,
          kind: 'crosssite_repuk_gap_fill',
          target: site.id,
          attempted: false,
          verified: false,
          dryRun: true,
          summary: `REPUK under quota yesterday (${site.sentCount}/${site.requiredCount}); would ensure today schedule via gap-fill`,
        });
      } else {
        const verify = await verifyRepukBufferSchedule({
          now: options?.now,
          gapFill: true,
        });
        const verified = verify.scheduledCount >= verify.requiredCount;
        repairs.push({
          id: `crosssite-${site.id}`,
          kind: 'crosssite_repuk_gap_fill',
          target: site.id,
          attempted: true,
          verified,
          dryRun: false,
          summary: verified
            ? `REPUK today schedule repaired to ${verify.scheduledCount}/${verify.requiredCount}`
            : `REPUK today still under quota ${verify.scheduledCount}/${verify.requiredCount}`,
        });
        if (verified) {
          logAutomationEvent('crosssite.quota.repaired', {
            siteId: site.id,
            scheduledCount: verify.scheduledCount,
          });
        }
      }

      issues.push({
        id: fingerprint,
        fingerprint,
        jobName: 'buffer-cross-site-report',
        category,
        severity: 'error',
        summary: `REPUK cross-site quota deficit on ${report.date}: ${site.sentCount}/${site.requiredCount}`,
        details: site.issue,
        recoverable: true,
        requiresHumanAction: false,
      });
    } else {
      // Sibling sites — optional remote schedule; never flood from REPUK multi-feed.
      const target = CROSS_SITE_BUFFER_TARGETS.find((t) => t.id === site.id);
      let remoteVerified = false;
      let remoteAttempted = false;

      if (!target) {
        repairs.push({
          id: `crosssite-${site.id}`,
          kind: 'crosssite_sibling_alert',
          target: site.id,
          attempted: false,
          verified: false,
          dryRun,
          summary: `Sibling deficit recorded — unknown production URL for ${site.id}`,
        });
      } else if (dryRun || !allowRemote || !canPerformLiveSideEffects()) {
        const preview = await triggerSiblingBufferSchedule(target, { dryRun: true });
        repairs.push({
          id: `crosssite-${site.id}`,
          kind: 'crosssite_sibling_remote_schedule',
          target: site.id,
          attempted: false,
          verified: false,
          dryRun: true,
          summary:
            preview.summary ||
            `Sibling deficit recorded — would remote-schedule ${site.hostname}`,
        });
      } else {
        const remote = await triggerSiblingBufferSchedule(target, { dryRun: false, force: true });
        remoteAttempted = remote.attempted;
        remoteVerified = remote.verified;
        repairs.push({
          id: `crosssite-${site.id}`,
          kind: 'crosssite_sibling_remote_schedule',
          target: site.id,
          attempted: remote.attempted,
          verified: remote.verified,
          dryRun: false,
          summary: remote.summary,
        });
        if (remote.verified) {
          logAutomationEvent('crosssite.quota.repaired', {
            siteId: site.id,
            via: 'remote_schedule',
          });
        }
      }

      // Yesterday's sent window cannot be rewritten. If we successfully kicked today's
      // sibling scheduler, treat as repaired/recoverable so the daily report does not
      // stay "Action Required" for a historical night-slot miss.
      const healedToday = remoteAttempted && remoteVerified;
      issues.push({
        id: fingerprint,
        fingerprint,
        jobName: 'buffer-cross-site-report',
        category,
        severity: healedToday ? 'warning' : 'error',
        summary: `${site.hostname} under quota on ${report.date}: ${site.sentCount}/${site.requiredCount}`,
        details: healedToday
          ? `${site.issue ?? 'below quota'}; yesterday cannot be backfilled — today remote schedule triggered`
          : site.issue ??
            'Sibling site self-scheduler may have failed; enable CROSS_SITE_REMOTE_REPAIR_ENABLED or repair on that site.',
        recoverable: true,
        requiresHumanAction: !healedToday,
      });
    }
  }

  return {
    ok: report.ok,
    date: report.date,
    expected,
    actual,
    sites: report.sites,
    repairs,
    issues,
  };
}
