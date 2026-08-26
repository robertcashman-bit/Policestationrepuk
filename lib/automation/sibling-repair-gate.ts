/**
 * Once-per-day gate for buffer-sibling-repair.
 *
 * Source-guard / deploy-hook / production-kick used to re-hit the cron many
 * times per day whenever yesterday was under quota. Lock only serialises
 * concurrent runs — each success still counted toward expectedExecutionsPerDay
 * (live: 17× on 2026-08-25). After one successful heal (or all-ok no-op),
 * further calls skip without writing another execution.
 */
import { getKV } from '@/lib/kv';
import { getSchedulerTimezone } from '@/lib/buffer/config';
import { localDateInTimezone } from '@/lib/buffer/scheduler-core';

const GATE_PREFIX = 'automation:sibling-repair:done:';
const GATE_TTL_SEC = 60 * 60 * 36; // cover London day + UTC skew

export function siblingRepairGateDate(now: Date = new Date()): string {
  return localDateInTimezone(now, getSchedulerTimezone());
}

function gateKey(date: string): string {
  return `${GATE_PREFIX}${date}`;
}

export async function isSiblingRepairDoneForDay(
  date = siblingRepairGateDate(),
): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  try {
    const v = await kv.get<string>(gateKey(date));
    return Boolean(v);
  } catch {
    return false;
  }
}

/** Mark today healed / no-op so further callers can skip. */
export async function markSiblingRepairDoneForDay(
  date = siblingRepairGateDate(),
  value = '1',
): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.set(gateKey(date), value, { ex: GATE_TTL_SEC });
  } catch {
    /* best-effort */
  }
}

/** Ops override — allow a forced re-run the same day. */
export async function clearSiblingRepairDoneForDay(
  date = siblingRepairGateDate(),
): Promise<void> {
  const kv = getKV();
  if (!kv?.del) return;
  try {
    await kv.del(gateKey(date));
  } catch {
    /* ignore */
  }
}
