import { verifyCrossSiteBufferPosts } from '@/lib/buffer/verify-cross-site';
import { CROSS_SITE_BUFFER_TARGETS } from '@/lib/buffer/cross-site-sites';
import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import { getAutomationConfig } from '../config';
import { canPerformLiveSideEffects } from '../env-guard';
import { buildIncidentFingerprint } from '../notifications';
import { logAutomationEvent } from '../observability';
import type { HealthIssue, RepairAction } from '../types';
import {
  scheduleSiblingFallbackFromRepuk,
  siblingFallbackPromos,
} from './sibling-fallback';
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
 * Auto-repair REPUK via local gap-fill. Sibling deficits trigger that site's
 * `/api/buffer/schedule` (+ verify) when remote repair is enabled / forced.
 * If the sibling endpoint is missing (e.g. custodynote), fall back to REPUK
 * promo scheduling for sites with a static catalog.
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

      const todayRepaired = repairs.some(
        (r) => r.kind === 'crosssite_repuk_gap_fill' && r.verified,
      );
      issues.push({
        id: fingerprint,
        fingerprint,
        jobName: 'buffer-cross-site-report',
        category,
        severity: todayRepaired || site.sentCount > 0 ? 'warning' : 'error',
        summary: `REPUK cross-site quota deficit on ${report.date}: ${site.sentCount}/${site.requiredCount}`,
        details: todayRepaired
          ? `${site.issue ?? 'Yesterday publish incomplete'}; today's schedule is on track.`
          : site.issue,
        recoverable: true,
        requiresHumanAction: false,
      });
    } else {
      // Sibling sites — remote schedule; never flood from REPUK multi-feed RSS.
      const target = CROSS_SITE_BUFFER_TARGETS.find((t) => t.id === site.id);
      let healedToday = false;

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
        const preview = await triggerSiblingBufferSchedule(target, {
          dryRun: true,
          fetchFn: fetch,
        });
        repairs.push({
          id: `crosssite-${site.id}`,
          kind: preview.endpointMissing
            ? 'crosssite_sibling_repuk_fallback'
            : 'crosssite_sibling_remote_schedule',
          target: site.id,
          attempted: false,
          verified: false,
          dryRun: true,
          summary:
            preview.endpointMissing
              ? (
                  await scheduleSiblingFallbackFromRepuk(target, {
                    dryRun: true,
                    now: options?.now,
                  })
                ).summary
              : preview.summary ||
                `Sibling deficit recorded — would remote-schedule ${site.hostname}`,
        });
      } else {
        const remote = await triggerSiblingBufferSchedule(target, {
          dryRun: false,
          force: true,
        });

        if (remote.verified) {
          healedToday = true;
          repairs.push({
            id: `crosssite-${site.id}`,
            kind: 'crosssite_sibling_remote_schedule',
            target: site.id,
            attempted: remote.attempted,
            verified: true,
            dryRun: false,
            summary: remote.summary,
          });
          logAutomationEvent('crosssite.quota.repaired', {
            siteId: site.id,
            via: 'remote_schedule',
          });
        } else if (
          remote.endpointMissing ||
          siblingFallbackPromos(site.id).length > 0
        ) {
          // Endpoint missing, or sibling scheduler returned 0 posts — use REPUK catalog.
          const fallback = await scheduleSiblingFallbackFromRepuk(target, {
            dryRun: false,
            now: options?.now,
          });
          healedToday = fallback.attempted && fallback.verified;
          repairs.push({
            id: `crosssite-${site.id}`,
            kind: 'crosssite_sibling_repuk_fallback',
            target: site.id,
            attempted: fallback.attempted || remote.attempted,
            verified: fallback.verified,
            dryRun: false,
            summary: `${remote.summary}; ${fallback.summary}`,
          });
        } else {
          repairs.push({
            id: `crosssite-${site.id}`,
            kind: 'crosssite_sibling_remote_schedule',
            target: site.id,
            attempted: remote.attempted,
            verified: false,
            dryRun: false,
            summary: remote.summary,
          });
        }
      }

      // Yesterday's sent window cannot be rewritten. If we successfully kicked today's
      // sibling scheduler (or REPUK fallback), treat as repaired so the daily report
      // does not stay "Action Required" for a historical night-slot miss.
      issues.push({
        id: fingerprint,
        fingerprint,
        jobName: 'buffer-cross-site-report',
        category,
        severity: healedToday ? 'warning' : 'error',
        summary: `${site.hostname} under quota on ${report.date}: ${site.sentCount}/${site.requiredCount}`,
        details: healedToday
          ? `${site.issue ?? 'below quota'}; yesterday cannot be backfilled — today schedule healed`
          : site.issue ??
            'Sibling site self-scheduler may have failed; enable CROSS_SITE_REMOTE_REPAIR_ENABLED or run /api/cron/buffer-sibling-repair.',
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
