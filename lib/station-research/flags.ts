/** Feature flags for continuous station-contact research (Phases 4–7). */

function envFlag(name: string, defaultOn = false): boolean {
  const raw = process.env[name];
  if (raw == null || raw === '') return defaultOn;
  return raw !== '0' && raw.toLowerCase() !== 'false' && raw !== 'off';
}

/** Master switch — off by default until dry-run comparison is reviewed. */
export function stationResearchEnabled(): boolean {
  return envFlag('STATION_RESEARCH_ENABLED', false);
}

/** When true (default), research never writes public station data. */
export function stationResearchDryRun(): boolean {
  return envFlag('STATION_RESEARCH_DRY_RUN', true);
}

/** Research main station lines (not custody — custody keeps its own pipeline). */
export function stationMainlineResearchEnabled(): boolean {
  return envFlag('STATION_MAINLINE_RESEARCH_ENABLED', false);
}

/**
 * Allow automatic publication of low-risk main-line updates.
 * Requires research enabled, dry-run off, and this flag on.
 */
export function stationResearchAutoPublishEnabled(): boolean {
  return (
    stationResearchEnabled() &&
    !stationResearchDryRun() &&
    envFlag('STATION_RESEARCH_AUTO_PUBLISH', false)
  );
}

export function stationResearchBatchLimit(): number {
  return Math.max(1, Number(process.env.STATION_RESEARCH_BATCH_LIMIT ?? 5));
}

export function stationResearchMaxQueries(): number {
  return Math.max(1, Number(process.env.STATION_RESEARCH_MAX_QUERIES ?? 3));
}

export function stationResearchMaxPages(): number {
  return Math.max(1, Number(process.env.STATION_RESEARCH_MAX_PAGES ?? 2));
}

export function stationResearchMaxElapsedMs(): number {
  return Math.max(15_000, Number(process.env.STATION_RESEARCH_MAX_ELAPSED_MS ?? 120_000));
}
