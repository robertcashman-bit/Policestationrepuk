/**
 * Diagnose why the outreach send loop is (not) sending.
 * Runs the real runFirmOutreach in DRY-RUN for each campaign and prints skip reasons.
 * npx tsx scripts/diag-why-not-sending.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const { OUTREACH_CAMPAIGN_IDS } = await import('../lib/firm-outreach/site-config');
  const { outreachEnabled, outreachSendEnabled, dailySendCap, outreachRequireApproval } = await import(
    '../lib/firm-outreach/constants'
  );
  const { runFirmOutreach } = await import('../lib/firm-outreach/outreach/run-outreach');
  const { countProspectsByStatus, getDailySendCount, getGlobalResendQuotaRemaining } = await import(
    '../lib/firm-outreach/storage'
  );
  const { getOutreachSendHealth } = await import('../lib/firm-outreach/outreach/from-address');

  const date = new Date().toISOString().slice(0, 10);

  console.log('=== GLOBAL FLAGS ===');
  console.log('FIRM_OUTREACH_ENABLED (outreachEnabled):', outreachEnabled());
  console.log('outreachSendEnabled:', outreachSendEnabled());
  console.log('outreachRequireApproval:', outreachRequireApproval());
  console.log('dailySendCap:', dailySendCap());
  console.log('date (UTC):', date);

  const health = await getOutreachSendHealth();
  console.log('\n=== SEND HEALTH ===');
  console.log(JSON.stringify(health, null, 2));

  console.log('\n=== PROSPECT STATUS COUNTS (all campaigns) ===');
  const counts = await countProspectsByStatus();
  console.log(JSON.stringify(counts, null, 2));

  const globalQuota = await getGlobalResendQuotaRemaining(date);
  console.log('\nglobal Resend quota remaining today:', globalQuota);

  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    console.log(`\n\n########## CAMPAIGN: ${campaignId} ##########`);
    const alreadySent = await getDailySendCount(date, campaignId);
    console.log('daily sent count today:', alreadySent);

    const stats = await runFirmOutreach({ campaignId, dryRun: true });
    console.log('--- DRY RUN STATS ---');
    console.log(JSON.stringify(stats, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
