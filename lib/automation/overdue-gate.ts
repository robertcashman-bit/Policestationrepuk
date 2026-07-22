import { getSchedulerTimezone } from '@/lib/buffer/config';
import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { getJobDefinition } from './job-registry';
import type { AutomationJobDefinition } from './types';

/**
 * Parse `m h * * *` style Vercel cron (UTC). Returns null if unsupported.
 */
export function parseDailyUtcCron(
  schedule: string,
): { minute: number; hourUtc: number } | null {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const minute = Number(parts[0]);
  const hourUtc = Number(parts[1]);
  if (
    !Number.isInteger(minute) ||
    !Number.isInteger(hourUtc) ||
    minute < 0 ||
    minute > 59 ||
    hourUtc < 0 ||
    hourUtc > 23
  ) {
    return null;
  }
  return { minute, hourUtc };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Instant when the daily UTC cron fires for a given Europe/London calendar date.
 * Vercel crons are UTC, so local date YYYY-MM-DD maps to that UTC clock time.
 */
export function scheduledRunUtcForLocalDate(
  localDate: string,
  minute: number,
  hourUtc: number,
): Date {
  return new Date(`${localDate}T${pad2(hourUtc)}:${pad2(minute)}:00.000Z`);
}

export interface BufferOverdueGateOptions {
  timezone?: string;
  job?: Pick<AutomationJobDefinition, 'expectedSchedule' | 'maxToleratedDelayMinutes'>;
}

/**
 * True only after today's buffer-blog-posts schedule + grace have passed.
 *
 * Fixes false overnight alerts: after London midnight "today" flips, but the
 * morning UTC cron has not run yet — the old UTC-hour>=06:30 gate still fired.
 */
export function isPastBufferOverdueGate(
  now: Date,
  options: BufferOverdueGateOptions = {},
): boolean {
  const timezone = options.timezone ?? getSchedulerTimezone();
  const job =
    options.job ??
    getJobDefinition('buffer-blog-posts') ?? {
      expectedSchedule: '5 5 * * *',
      maxToleratedDelayMinutes: 45,
    };

  const parsed = parseDailyUtcCron(job.expectedSchedule);
  if (!parsed) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return hour > 7 || (hour === 7 && minute >= 0);
  }

  const today = localDateInTimezone(now, timezone);
  const scheduled = scheduledRunUtcForLocalDate(today, parsed.minute, parsed.hourUtc);
  const graceMs = Math.max(0, job.maxToleratedDelayMinutes) * 60_000;
  const overdueAfter = new Date(scheduled.getTime() + graceMs);
  return now.getTime() >= overdueAfter.getTime();
}
