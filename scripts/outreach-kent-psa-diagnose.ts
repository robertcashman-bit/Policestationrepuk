#!/usr/bin/env npx tsx
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../lib/firm-outreach/campaign-scope';
import { isKentProspectInput } from '../lib/firm-outreach/kent-filter';
import { selectOutreachCandidates } from '../lib/firm-outreach/outreach/candidate-selection';
import { qualifyProspectForOutreach } from '../lib/firm-outreach/qualification';
import { requalifyAllProspects } from '../lib/firm-outreach/requalify-prospects';
import { isSendableReadyProspect } from '../lib/firm-outreach/sendable-ready';
import { syncKentProspectsToAgentCover } from '../lib/firm-outreach/sync-kent-to-agent-cover';
import { FIRM_OUTREACH_CAMPAIGN_ID } from '../lib/firm-outreach/site-config';
import { getProspect, listAllProspectIds } from '../lib/firm-outreach/storage';

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key] && value && value !== '[SENSITIVE]') process.env[key] = value;
  }
}

async function main() {
  for (const f of ['.env.local', '.vercel/.env.production.local']) loadEnvFile(f);
  const apply = process.argv.includes('--apply');

  const repukKentByStatus: Record<string, number> = {};
  const repukKentExcluded: Record<string, number> = {};
  let repukKentQualifyOk = 0;
  const ids = await listAllProspectIds();
  for (const id of ids) {
    const p = await getProspect(id);
    if (!p || p.campaignId !== FIRM_OUTREACH_CAMPAIGN_ID || !p.email?.trim() || !isKentProspectInput(p))
      continue;
    repukKentByStatus[p.status] = (repukKentByStatus[p.status] ?? 0) + 1;
    if (p.status === 'excluded' && p.excludedReason) {
      repukKentExcluded[p.excludedReason] = (repukKentExcluded[p.excludedReason] ?? 0) + 1;
    }
    if (qualifyProspectForOutreach(p).qualified) repukKentQualifyOk++;
  }
  console.log('RepUK Kent status:', repukKentByStatus);
  console.log('RepUK Kent excluded:', repukKentExcluded);
  console.log('RepUK Kent qualify OK:', repukKentQualifyOk);

  if (!apply) {
    const dry = await syncKentProspectsToAgentCover({ dryRun: true });
    console.log('Sync dry-run:', dry);
    return;
  }

  const sync = await syncKentProspectsToAgentCover({ limit: 500, maxElapsedMs: 120_000 });
  console.log('Sync applied:', sync);
  const rq = await requalifyAllProspects({ verifyWebsites: false, mxCheckLimit: 20 });
  console.log('Requalify:', {
    promotedToReady: rq.promotedToReady,
    sendableReady: rq.sendableReady,
    downgradedFromReady: rq.downgradedFromReady,
  });

  let psaReady = 0;
  let psaSendable = 0;
  const psaByStatus: Record<string, number> = {};
  for (const id of ids) {
    const p = await getProspect(id);
    if (!p || p.campaignId !== AGENT_COVER_KENT_CAMPAIGN_ID) continue;
    psaByStatus[p.status] = (psaByStatus[p.status] ?? 0) + 1;
    if (p.status === 'ready_to_send') {
      psaReady++;
      if (isSendableReadyProspect(p)) psaSendable++;
    }
  }
  const sel = await selectOutreachCandidates({
    campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
    readyLimit: 500,
    sentLimit: 200,
  });
  console.log('PSA after:', {
    psaByStatus,
    psaReady,
    psaSendable,
    sendableCandidates: sel.candidates.length,
    readyEligible: sel.readyEligible,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
