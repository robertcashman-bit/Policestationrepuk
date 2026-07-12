import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const { getKV } = await import('../lib/kv');
  const { getLatestOutreachRunLog, getDailySendCount } = await import('../lib/firm-outreach/storage');
  const { OUTREACH_CAMPAIGN_IDS } = await import('../lib/firm-outreach/site-config');
  const kv = getKV()!;
  const date = new Date().toISOString().slice(0, 10);

  for (const cid of OUTREACH_CAMPAIGN_IDS) {
    console.log(`\n=== ${cid} ===`);
    console.log('dailySendCount today:', await getDailySendCount(date, cid));
    const latest = await getLatestOutreachRunLog(cid);
    console.log(
      'latest run log:',
      latest
        ? JSON.stringify(
            {
              startedAt: latest.startedAt,
              sent: latest.sent,
              skipped: latest.skipped,
              errors: latest.errors,
              skipReasons: latest.skipReasons,
              sentTodayBefore: latest.sentTodayBefore,
              dailyCap: latest.dailyCap,
            },
            null,
            2,
          )
        : 'NONE',
    );
    const keys = await kv.keys(`firmoutreach:runlog:${cid}:*`);
    console.log('run log timestamps (recent):', keys.map((k) => k.split(':').pop()).sort().slice(-10));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
