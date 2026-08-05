/**
 * Run firm prospect discovery (LAA + DSCC + archive + directory).
 * npx tsx scripts/firm-outreach-discovery.ts
 * npx tsx scripts/firm-outreach-discovery.ts --campaign=agent_cover_kent_v1
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

async function main() {
  const { runFirmDiscovery } = await import('../lib/firm-outreach/discovery/run-discovery');
  const { AGENT_COVER_KENT_CAMPAIGN_ID } = await import('../lib/firm-outreach/campaign-scope');
  const { FIRM_OUTREACH_CAMPAIGN_ID } = await import('../lib/firm-outreach/site-config');

  const arg = process.argv.find((a) => a.startsWith('--campaign='));
  const raw = arg?.slice('--campaign='.length)?.trim();
  const campaignId =
    raw === AGENT_COVER_KENT_CAMPAIGN_ID || raw === 'psa' || raw === 'agent'
      ? AGENT_COVER_KENT_CAMPAIGN_ID
      : FIRM_OUTREACH_CAMPAIGN_ID;

  console.log(`[firm-outreach discovery] starting campaign=${campaignId}`);
  const stats = await runFirmDiscovery({ campaignId });
  console.log('[firm-outreach discovery]', JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error('[firm-outreach discovery] failed:', err);
  process.exit(1);
});
