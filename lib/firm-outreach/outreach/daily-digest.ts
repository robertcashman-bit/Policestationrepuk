import { claimKey } from '@/lib/kv-atomic';
import { getKV } from '@/lib/kv';

export function localDateInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

const DEDUP_PREFIX = 'firmoutreach:digest:sent:';
export const NOTIFY_TIMEZONE =
  process.env.FIRM_OUTREACH_DIGEST_TIMEZONE?.trim() || 'Europe/London';

export function outreachDigestDedupKey(campaignId: string, date: string): string {
  return `${DEDUP_PREFIX}${campaignId}:${date}`;
}

export function outreachDigestDate(now = new Date()): string {
  return localDateInTimezone(now, NOTIFY_TIMEZONE);
}

export async function wasOutreachDigestSent(
  date: string,
  campaignId: string,
): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(outreachDigestDedupKey(campaignId, date)));
}

/** Atomic claim — only one outreach digest per campaign/date. */
export async function claimOutreachDigest(date: string, campaignId: string): Promise<boolean> {
  return claimKey(outreachDigestDedupKey(campaignId, date), 60 * 60 * 24 * 14);
}

export async function markOutreachDigestSent(date: string, campaignId: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(outreachDigestDedupKey(campaignId, date), new Date().toISOString(), {
    ex: 60 * 60 * 24 * 14,
  });
}

const MORNING_DIGEST_PREFIX = 'firmoutreach:morning-digest:sent:';

/** Local hour (24h) when the daily results email is sent — default 08:00 Europe/London. */
export const MORNING_DIGEST_HOUR = Number(
  process.env.FIRM_OUTREACH_MORNING_DIGEST_HOUR ?? 8,
);

export function morningDigestDedupKey(date: string): string {
  return `${MORNING_DIGEST_PREFIX}${date}`;
}

/** Calendar date one day before the given YYYY-MM-DD anchor (London timezone semantics). */
export function previousDigestDate(date: string): string {
  const anchor = new Date(`${date}T12:00:00.000Z`);
  anchor.setUTCDate(anchor.getUTCDate() - 1);
  return localDateInTimezone(anchor, NOTIFY_TIMEZONE);
}

export function localHourInTimezone(now: Date, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).format(now),
  );
}

/** True when the clock in NOTIFY_TIMEZONE is exactly the configured morning digest hour. */
export function isMorningDigestSendWindow(now = new Date()): boolean {
  return localHourInTimezone(now, NOTIFY_TIMEZONE) === MORNING_DIGEST_HOUR;
}

export async function wasMorningDigestSent(date: string): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(morningDigestDedupKey(date)));
}

export async function claimMorningDigest(date: string): Promise<boolean> {
  return claimKey(morningDigestDedupKey(date), 60 * 60 * 24 * 14);
}

export async function markMorningDigestSent(date: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(morningDigestDedupKey(date), new Date().toISOString(), {
    ex: 60 * 60 * 24 * 14,
  });
}
