/** Cron outcomes that mean the job ran in-window (including partial work). */
export function cronOutcomeCountsAsSuccess(outcome: string | undefined | null): boolean {
  return outcome === 'success' || outcome === 'skipped' || outcome === 'partial';
}
