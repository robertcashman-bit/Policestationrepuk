import { verifyRepukBufferSchedule, runRepukBufferScheduler } from '@/lib/buffer/engine-run';
import { verifyBufferPostsPublished } from '@/lib/buffer/verify-posted';
import { getSchedulerTimezone } from '@/lib/buffer/config';
import {
  addDaysToLocalDate,
  localDateInTimezone,
} from '@/lib/buffer/scheduler-core';
import { getAutomationConfig } from '../config';
import { canPerformLiveSideEffects } from '../env-guard';
import { logAutomationEvent } from '../observability';
import type { RepairAction } from '../types';

export interface BufferRepairResult {
  repairs: RepairAction[];
  todayScheduled: number;
  todayRequired: number;
  yesterdayOk: boolean;
  yesterdaySent: number;
  yesterdayTotal: number;
  yesterdayProblems: number;
}

/**
 * Safe Buffer repairs for REPUK only:
 * - gap-fill today's under-quota schedule via existing verify path
 * - force scheduler only when no run and under quota (respectCurrentTime)
 * Does not publish meaningless test content.
 */
export async function repairBufferSchedule(options?: {
  dryRun?: boolean;
  now?: Date;
  /** Admin/ops override — perform live repairs even when AUTO_REPAIR_ENABLED=0. */
  forceLive?: boolean;
}): Promise<BufferRepairResult> {
  const config = getAutomationConfig();
  const dryRun = options?.dryRun ?? config.dryRun;
  const forceLive = options?.forceLive === true;
  const now = options?.now ?? new Date();
  const timezone = getSchedulerTimezone();
  const today = localDateInTimezone(now, timezone);
  const yesterday = addDaysToLocalDate(today, -1);
  const repairs: RepairAction[] = [];

  // Yesterday publish verification (inspect only — reschedule overdue flood is unsafe).
  const published = await verifyBufferPostsPublished(yesterday);
  const yesterdayOk = published.ok || published.reason === 'no_run';
  if (published.problems?.length) {
    logAutomationEvent('buffer.update.missing', {
      date: yesterday,
      count: published.problems.length,
    });
    for (const problem of published.problems.slice(0, 5)) {
      repairs.push({
        id: `yesterday-${problem.postId}`,
        kind: 'buffer_missing_or_failed',
        target: problem.postId,
        attempted: false,
        verified: false,
        dryRun,
        summary: `${problem.slug} status=${problem.status} (${problem.issue ?? 'unknown'}) — not auto-republished to avoid floods`,
      });
    }
  }

  // Today's schedule gap-fill.
  // Automated paths require AUTO_REPAIR_ENABLED; explicit admin forceLive may proceed.
  const allowLive =
    !dryRun && canPerformLiveSideEffects() && (forceLive || config.autoRepairEnabled);
  if (!allowLive) {
    const verifyDry = await verifyRepukBufferSchedule({ now, gapFill: false });
    repairs.push({
      id: 'gap-fill-today',
      kind: 'buffer_gap_fill',
      target: today,
      attempted: false,
      verified: false,
      dryRun: true,
      summary: `Would gap-fill if under quota (currently ${verifyDry.scheduledCount}/${verifyDry.requiredCount})`,
    });
    return {
      repairs,
      todayScheduled: verifyDry.scheduledCount,
      todayRequired: verifyDry.requiredCount,
      yesterdayOk,
      yesterdaySent: published.sent ?? 0,
      yesterdayTotal: published.total ?? 0,
      yesterdayProblems: published.problems?.length ?? 0,
    };
  }

  logAutomationEvent('buffer.update.retry_started', { date: today, kind: 'gap_fill' });
  const verify = await verifyRepukBufferSchedule({ now, gapFill: true });
  const gapFilled = verify.gapFilled ?? 0;
  repairs.push({
    id: 'gap-fill-today',
    kind: 'buffer_gap_fill',
    target: today,
    attempted: true,
    verified: verify.ok && verify.scheduledCount >= verify.requiredCount,
    dryRun: false,
    summary: verify.ok
      ? `Schedule OK ${verify.scheduledCount}/${verify.requiredCount} (gapFilled=${gapFilled})`
      : `Still under quota ${verify.scheduledCount}/${verify.requiredCount}: ${verify.issues.join('; ')}`,
    error: verify.ok ? undefined : verify.issues.join('; '),
  });

  // Only unbounded force-schedule when Buffer has nothing for today.
  // Partial shortfalls: retry gap-fill once more with force after a failed
  // idempotent pass (live: 4/5 stuck because gapFilled=0 and this branch
  // previously required scheduledCount===0).
  if (!verify.ok && gapFilled === 0) {
    const schedule = await runRepukBufferScheduler({
      now,
      force: true,
      respectCurrentTime: true,
      limit: Math.max(1, verify.requiredCount - verify.scheduledCount),
    });
    repairs.push({
      id: 'force-schedule-today',
      kind: 'buffer_force_schedule',
      target: today,
      attempted: true,
      verified: Boolean(schedule.ok),
      dryRun: false,
      summary: schedule.ok
        ? `Scheduler recovered (${schedule.posts?.length ?? 0} posts; was ${verify.scheduledCount}/${verify.requiredCount})`
        : `Scheduler recovery failed: ${schedule.reason ?? 'unknown'}`,
      error: schedule.ok ? undefined : schedule.reason,
    });
    const recheck = await verifyRepukBufferSchedule({ now, gapFill: true });
    if (schedule.ok || recheck.ok) {
      logAutomationEvent('buffer.update.retry_verified', {
        date: today,
        scheduledCount: recheck.scheduledCount,
      });
    }
    return {
      repairs,
      todayScheduled: recheck.scheduledCount,
      todayRequired: recheck.requiredCount,
      yesterdayOk,
      yesterdaySent: published.sent ?? 0,
      yesterdayTotal: published.total ?? 0,
      yesterdayProblems: published.problems?.length ?? 0,
    };
  }

  if (verify.ok && gapFilled > 0) {
    logAutomationEvent('buffer.update.retry_verified', {
      date: today,
      gapFilled,
    });
  }

  return {
    repairs,
    todayScheduled: verify.scheduledCount,
    todayRequired: verify.requiredCount,
    yesterdayOk,
    yesterdaySent: published.sent ?? 0,
    yesterdayTotal: published.total ?? 0,
    yesterdayProblems: published.problems?.length ?? 0,
  };
}
