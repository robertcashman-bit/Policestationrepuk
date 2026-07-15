/**
 * Local / ops runner for PSR verify batch.
 *   npx tsx scripts/run-psr-verify.ts --limit=10
 *   npx tsx scripts/run-psr-verify.ts --suite=medway-police-station
 */
import { runPsrVerifyBatch, setPsrCrawlMode } from '../lib/custody-discovery/psr-verify';

async function main() {
  const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '10');
  const suiteId = process.argv.find((a) => a.startsWith('--suite='))?.split('=')[1]?.trim();
  const mode = process.argv.find((a) => a.startsWith('--mode='))?.split('=')[1]?.trim();
  if (mode === 'backfill' || mode === 'steady') await setPsrCrawlMode(mode);

  const stats = await runPsrVerifyBatch({
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    forceSuiteId: suiteId,
  });
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
