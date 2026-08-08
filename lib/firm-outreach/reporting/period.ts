/**
 * Reporting period: previous complete Europe/London calendar day
 * (00:00 → 24:00 London), reported at 07:00 London the following morning.
 */
import { localDateInTimezone } from '../outreach/daily-digest';

export const REPORT_TIMEZONE = 'Europe/London';

export function londonDateString(now = new Date()): string {
  return localDateInTimezone(now, REPORT_TIMEZONE);
}

/** Yesterday in Europe/London (the period the 07:00 report covers). */
export function previousLondonDate(now = new Date()): string {
  // Walk back ~26h then format in London — robust across DST.
  const probe = new Date(now.getTime() - 26 * 60 * 60 * 1000);
  const yesterday = localDateInTimezone(probe, REPORT_TIMEZONE);
  const today = londonDateString(now);
  if (yesterday !== today) return yesterday;
  const probe2 = new Date(now.getTime() - 36 * 60 * 60 * 1000);
  return localDateInTimezone(probe2, REPORT_TIMEZONE);
}

/**
 * Inclusive start / exclusive end Instant bounds for a London calendar date.
 */
export function londonDayBounds(londonDate: string): { start: Date; end: Date } {
  // Construct via formatToParts search — find UTC instant where London date flips.
  const start = findLondonMidnightUtc(londonDate);
  const next = nextLondonDate(londonDate);
  const end = findLondonMidnightUtc(next);
  return { start, end };
}

function nextLondonDate(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  // Midday UTC on that civil date + 24h, then re-format in London.
  const mid = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const nextMid = new Date(mid.getTime() + 24 * 60 * 60 * 1000);
  return localDateInTimezone(nextMid, REPORT_TIMEZONE);
}

function findLondonMidnightUtc(londonDate: string): Date {
  // Binary-ish search: start from UTC midnight of that civil date ± 2h.
  const [y, m, d] = londonDate.split('-').map(Number);
  let guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  // Adjust until localDateInTimezone(guess) === londonDate and previous minute is previous day.
  for (let i = 0; i < 48; i++) {
    const cur = localDateInTimezone(new Date(guess), REPORT_TIMEZONE);
    if (cur < londonDate) {
      guess += 30 * 60 * 1000;
      continue;
    }
    if (cur > londonDate) {
      guess -= 30 * 60 * 1000;
      continue;
    }
    // On the correct day — walk back to the first minute of that day.
    while (localDateInTimezone(new Date(guess - 60_000), REPORT_TIMEZONE) === londonDate) {
      guess -= 60_000;
    }
    return new Date(guess);
  }
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

/** True when now is the 07:00 London hour (for cron gating). */
export function isLondon0700Hour(now = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: REPORT_TIMEZONE,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now),
  );
  return hour === 7;
}

/** Winter (GMT): 07:00 UTC. Summer (BST): 06:00 UTC. */
export function expectedUtcHoursForLondon0700(): number[] {
  return [6, 7];
}
