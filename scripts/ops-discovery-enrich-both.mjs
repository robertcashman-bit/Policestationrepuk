#!/usr/bin/env node
/**
 * Operator: discovery + enrich for RepUK + PSA against production KV.
 * Usage: npx tsx scripts/ops-discovery-enrich-both.mjs
 * Env: ENRICH_BATCHES (default 6), ENRICH_LIMIT (default 40), SKIP_DISCOVERY=1
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local'), override: true });

process.env.FIRM_OUTREACH_FROM_EMAIL ||=
  'PoliceStationRepUK <noreply@policestationrepuk.org>';
process.env.FIRM_OUTREACH_PSA_FROM_EMAIL ||=
  'Police Station Agent <noreply@policestationagent.com>';
process.env.FIRM_OUTREACH_DIGEST_EMAIL ||= 'robertdavidcashman@gmail.com';
process.env.FIRM_OUTREACH_DRY_RUN = '0';
delete process.env.FIRM_OUTREACH_DAILY_CAP;

const enrichBatches = Number(process.env.ENRICH_BATCHES || 6);
const enrichLimit = Number(process.env.ENRICH_LIMIT || 40);
const skipDiscovery = ['1', 'true', 'yes', 'on'].includes(
  (process.env.SKIP_DISCOVERY || '').trim().toLowerCase(),
);

async function enrichCampaign(runFirmEnrichment, campaignId, label) {
  console.log(`=== ENRICH ${label} (${enrichBatches}×${enrichLimit}) ===`);
  let ready = 0;
  for (let i = 0; i < enrichBatches; i++) {
    const stats = await runFirmEnrichment({ campaignId, limit: enrichLimit });
    ready += stats.readyToSend ?? 0;
    console.log(
      `  batch ${i + 1}/${enrichBatches}: ready+=${stats.readyToSend ?? 0} scanned=${stats.scanned ?? '?'} elapsedMs=${stats.elapsedMs ?? '?'}`,
    );
  }
  console.log(`  ${label} enrich done (ready deltas sum=${ready})`);
}

async function main() {
  const { runFirmDiscovery } = await import('../lib/firm-outreach/discovery/run-discovery');
  const { recoverEnrichPool } = await import('../lib/firm-outreach/enrichment/recover-enrich-pool');
  const { runFirmEnrichment } = await import('../lib/firm-outreach/enrichment/run-enrich');
  const { AGENT_COVER_KENT_CAMPAIGN_ID } = await import('../lib/firm-outreach/campaign-scope');
  const { FIRM_OUTREACH_CAMPAIGN_ID } = await import('../lib/firm-outreach/site-config');
  const { syncKentProspectsToAgentCover } = await import(
    '../lib/firm-outreach/sync-kent-to-agent-cover'
  );
  const { countProspectsByStatus } = await import('../lib/firm-outreach/storage');

  if (!skipDiscovery) {
    console.log('=== DISCOVERY RepUK ===');
    console.log(JSON.stringify(await runFirmDiscovery({ campaignId: FIRM_OUTREACH_CAMPAIGN_ID }), null, 2));

    console.log('=== DISCOVERY PSA (nationwide) ===');
    console.log(
      JSON.stringify(await runFirmDiscovery({ campaignId: AGENT_COVER_KENT_CAMPAIGN_ID }), null, 2),
    );

    console.log('=== SYNC Kent → PSA ===');
    console.log(JSON.stringify(await syncKentProspectsToAgentCover(), null, 2));
  } else {
    console.log('=== SKIP_DISCOVERY=1 — enrich only ===');
  }

  console.log('=== RECOVER enrich pools ===');
  for (const campaignId of [FIRM_OUTREACH_CAMPAIGN_ID, AGENT_COVER_KENT_CAMPAIGN_ID]) {
    const recovered = await recoverEnrichPool({ campaignId });
    console.log(`  ${campaignId}:`, recovered);
  }

  await enrichCampaign(runFirmEnrichment, FIRM_OUTREACH_CAMPAIGN_ID, 'RepUK');
  await enrichCampaign(runFirmEnrichment, AGENT_COVER_KENT_CAMPAIGN_ID, 'PSA');

  console.log('=== STATUS counts ===');
  console.log(JSON.stringify(await countProspectsByStatus(), null, 2));
}

main().catch((err) => {
  console.error('[ops-discovery-enrich-both] failed:', err);
  process.exit(1);
});
