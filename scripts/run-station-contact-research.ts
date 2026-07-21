#!/usr/bin/env npx tsx
/**
 * Manual / CI station-contact research (dry-run by default).
 *
 *   npx tsx scripts/run-station-contact-research.ts --limit=3
 *   npx tsx scripts/run-station-contact-research.ts --limit=3 --force
 */
import { getAllStations } from '../lib/data';
import { runStationContactResearch } from '../lib/station-research';

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 3;
  const force = args.includes('--force');
  const dryRun = !args.includes('--apply');

  const stations = await getAllStations();
  const report = await runStationContactResearch({
    stations,
    limit,
    dryRun,
    force,
  });

  console.log(
    JSON.stringify(
      {
        runId: report.runId,
        dryRun: report.dryRun,
        enabled: report.enabled,
        stationsResearched: report.stationsResearched,
        candidatesFound: report.candidatesFound,
        queuedForAdmin: report.queuedForAdmin,
        rejected: report.rejected,
        leftUnchanged: report.leftUnchanged,
        errors: report.errors,
        sample: report.candidates.slice(0, 5).map((c) => ({
          station: c.stationName,
          value: c.displayValue,
          type: c.contactType,
          score: c.confidenceScore,
          decision: c.decision,
          reasons: c.decisionReasons,
          source: c.evidence[0]?.sourceUrl,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
