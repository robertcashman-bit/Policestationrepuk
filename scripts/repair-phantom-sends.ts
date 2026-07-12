/**
 * One-shot repair: remove phantom send records (no Resend message id) and
 * reconcile affected prospects + optional daily cap counters.
 *
 *   npx tsx scripts/repair-phantom-sends.ts
 *   npx tsx scripts/repair-phantom-sends.ts --apply
 *   npx tsx scripts/repair-phantom-sends.ts --apply --campaign=agent_cover_kent_v1
 *   npx tsx scripts/repair-phantom-sends.ts --apply --recount-daily-caps
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const APPLY = process.argv.includes('--apply');
const RECOUNT_DAILY = process.argv.includes('--recount-daily-caps');
const campaignArg = process.argv.find((a) => a.startsWith('--campaign='));
const campaignFilter = campaignArg?.split('=')[1]?.trim() || undefined;

async function main() {
  const { getKV } = await import('../lib/kv');
  if (!getKV()) {
    console.error('[repair-phantom] KV not configured');
    process.exit(1);
  }

  const {
    countRealSendsByDayCampaign,
    isPhantomSend,
    reconcileProspectAfterPhantomRemoval,
    realSendsForCampaign,
  } = await import('../lib/firm-outreach/outreach/phantom-send-repair');
  const {
    deleteSendRecord,
    getProspect,
    listAllSends,
    saveProspect,
  } = await import('../lib/firm-outreach/storage');
  const { dailySendKeyForCampaignId } = await import('../lib/firm-outreach/campaign-scope');
  const { OUTREACH_CAMPAIGN_IDS } = await import('../lib/firm-outreach/site-config');

  const allSends = await listAllSends();
  let phantoms = allSends.filter(isPhantomSend);
  if (campaignFilter) {
    phantoms = phantoms.filter((s) => s.campaignId === campaignFilter);
  }

  const byCampaign: Record<string, number> = {};
  for (const s of phantoms) {
    byCampaign[s.campaignId] = (byCampaign[s.campaignId] ?? 0) + 1;
  }

  console.log('[repair-phantom] mode:', APPLY ? 'APPLY' : 'DRY-RUN');
  console.log('[repair-phantom] phantom send records:', phantoms.length);
  console.log('[repair-phantom] by campaign:', byCampaign);

  const affectedProspectIds = [...new Set(phantoms.map((s) => s.prospectId))];
  console.log('[repair-phantom] affected prospects:', affectedProspectIds.length);

  let deleted = 0;
  let prospectsUpdated = 0;
  let prospectsUnchanged = 0;
  const samples: Array<{ prospectId: string; from: string; to: string }> = [];

  const sendsAfterDelete = allSends.filter((s) => !phantoms.some((p) => p.id === s.id));

  for (const prospectId of affectedProspectIds) {
    const prospect = await getProspect(prospectId);
    if (!prospect) continue;
    if (campaignFilter && prospect.campaignId !== campaignFilter) continue;

    const remaining = sendsAfterDelete.filter((s) => s.prospectId === prospectId);
    const next = reconcileProspectAfterPhantomRemoval(prospect, remaining);

    if (next) {
      const from = `${prospect.status}/step${prospect.sequenceStep}`;
      const to = `${next.status}/step${next.sequenceStep}`;
      if (samples.length < 8) {
        samples.push({ prospectId, from, to });
      }
      if (APPLY) {
        await saveProspect(next, prospect.status);
      }
      prospectsUpdated++;
    } else {
      prospectsUnchanged++;
    }
  }

  if (APPLY) {
    for (const phantom of phantoms) {
      await deleteSendRecord(phantom);
      deleted++;
    }
  } else {
    deleted = phantoms.length;
  }

  console.log('[repair-phantom] phantom sends removed:', deleted);
  console.log('[repair-phantom] prospects reconciled:', prospectsUpdated);
  console.log('[repair-phantom] prospects unchanged:', prospectsUnchanged);
  if (samples.length) {
    console.log('[repair-phantom] sample prospect fixes:');
    for (const s of samples) console.log(`  ${s.prospectId}: ${s.from} → ${s.to}`);
  }

  if (RECOUNT_DAILY) {
    const realCounts = countRealSendsByDayCampaign(
      sendsAfterDelete.filter((s) => !campaignFilter || s.campaignId === campaignFilter),
    );
    const campaigns = campaignFilter ? [campaignFilter] : [...OUTREACH_CAMPAIGN_IDS];
    const kv = getKV()!;
    let capsFixed = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (const [key, count] of realCounts) {
      const [campaignId, date] = key.split(':');
      if (!campaigns.includes(campaignId)) continue;
      const capKey = dailySendKeyForCampaignId(campaignId, date);
      if (APPLY) {
        await kv.set(capKey, count);
      }
      console.log(`[repair-phantom] daily cap ${campaignId} ${date} → ${count}`);
      capsFixed++;
    }

    // Zero out recent days that had phantoms but no real sends
    if (APPLY) {
      const phantomDays = new Set(
        phantoms.map((s) => `${s.campaignId}:${s.sentAt?.slice(0, 10) ?? ''}`).filter((k) => !k.endsWith(':')),
      );
      for (const key of phantomDays) {
        if (realCounts.has(key)) continue;
        const [campaignId, date] = key.split(':');
        if (!campaigns.includes(campaignId)) continue;
        await kv.set(dailySendKeyForCampaignId(campaignId, date), 0);
        console.log(`[repair-phantom] daily cap ${campaignId} ${date} → 0 (phantom-only day)`);
        capsFixed++;
      }

      // Reconcile today's counters even when phantom rows are already gone
      const { findDailyCapDrift, fixDailyCapDrift } = await import(
        '../lib/firm-outreach/outreach/phantom-send-repair-apply'
      );
      const drifts = await findDailyCapDrift(sendsAfterDelete, today);
      if (drifts.length > 0) {
        capsFixed += await fixDailyCapDrift(sendsAfterDelete, today);
        console.log(`[repair-phantom] reconciled ${drifts.length} cap drift(s) for ${today}`);
      }
    }

    console.log('[repair-phantom] daily cap keys updated:', capsFixed);
  }

  // Summary: real sends remaining per campaign
  const realRemaining: Record<string, number> = {};
  for (const cid of OUTREACH_CAMPAIGN_IDS) {
    if (campaignFilter && cid !== campaignFilter) continue;
    realRemaining[cid] = realSendsForCampaign(sendsAfterDelete, cid).length;
  }
  console.log('[repair-phantom] provider-confirmed sends remaining:', realRemaining);

  if (!APPLY) {
    console.log('\n[repair-phantom] Re-run with --apply to write changes.');
  }
}

main().catch((err) => {
  console.error('[repair-phantom] failed:', err);
  process.exit(1);
});
