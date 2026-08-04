/**
 * Split shared Resend remaining quota so RepUK cannot starve the PSA Kent campaign.
 *
 * Default floor: max(5, floor(pool / 4)), overridable via FIRM_OUTREACH_PSA_DAILY_RESERVE.
 * `pool` is min(globalRemaining, sendLimit) when a batch ceiling is set.
 */
export function psaSendReserve(opts: {
  globalRemaining: number;
  psaReadyCount: number;
  /** Optional cron/batch ceiling applied to the combined send pool. */
  sendLimit?: number;
}): { psaLimit: number; repukLimit: number } {
  const global = Math.max(0, Math.floor(opts.globalRemaining));
  const ready = Math.max(0, Math.floor(opts.psaReadyCount));
  const batchCap =
    opts.sendLimit != null && Number.isFinite(opts.sendLimit)
      ? Math.max(0, Math.floor(opts.sendLimit))
      : Number.POSITIVE_INFINITY;

  if (global <= 0 || batchCap <= 0) {
    return { psaLimit: 0, repukLimit: 0 };
  }

  const pool = Math.min(global, batchCap);

  if (ready <= 0) {
    return { psaLimit: 0, repukLimit: pool };
  }

  const envRaw = process.env.FIRM_OUTREACH_PSA_DAILY_RESERVE?.trim();
  const envReserve = envRaw ? Number(envRaw) : NaN;
  const preferredFloor =
    Number.isFinite(envReserve) && envReserve > 0
      ? Math.floor(envReserve)
      : Math.max(5, Math.floor(pool / 4));

  const psaLimit = Math.min(ready, preferredFloor, pool);
  const repukLimit = Math.max(0, pool - psaLimit);
  return { psaLimit, repukLimit };
}
