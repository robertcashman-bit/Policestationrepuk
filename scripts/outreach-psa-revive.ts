#!/usr/bin/env npx tsx
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../lib/firm-outreach/campaign-scope';
import { selectOutreachCandidates } from '../lib/firm-outreach/outreach/candidate-selection';
import { reviveAgentCoverKentReady } from '../lib/firm-outreach/revive-agent-cover-ready';
import { syncKentProspectsToAgentCover } from '../lib/firm-outreach/sync-kent-to-agent-cover';

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

  const sync = await syncKentProspectsToAgentCover({
    dryRun: !apply,
    limit: 200,
    maxElapsedMs: 55_000,
  });
  console.log('sync', sync);

  const revive = await reviveAgentCoverKentReady({
    dryRun: !apply,
    limit: 80,
    maxElapsedMs: 55_000,
  });
  console.log('revive', revive);

  const sel = await selectOutreachCandidates({
    campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
    readyLimit: 500,
    sentLimit: 50,
  });
  console.log('psa selection', {
    readyScanned: sel.readyScanned,
    readyEligible: sel.readyEligible,
    sendableCandidates: sel.candidates.length,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
