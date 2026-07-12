import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const { listAllSends } = await import('../lib/firm-outreach/storage');
  const { fixDailyCapDrift, findDailyCapDrift } = await import(
    '../lib/firm-outreach/outreach/phantom-send-repair-apply'
  );
  const date = new Date().toISOString().slice(0, 10);
  const sends = await listAllSends();
  console.log('drifts before:', await findDailyCapDrift(sends, date));
  const fixed = await fixDailyCapDrift(sends, date);
  console.log('fixed keys:', fixed);
  console.log('drifts after:', await findDailyCapDrift(sends, date));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
