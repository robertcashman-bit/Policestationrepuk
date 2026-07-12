#!/usr/bin/env node
/**
 * Trigger a live production send tick.
 * FIRM_OUTREACH_KICK_BASE_URL=https://policestationrepuk.org npx tsx scripts/trigger-production-send.ts [--limit=5]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveKickAuth, runProductionKickSteps } from '../lib/firm-outreach/production-kick';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const limitArg = process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1];
const limit = Math.max(1, Number(limitArg ?? 5) || 5);
const baseUrl = process.env.FIRM_OUTREACH_KICK_BASE_URL?.trim() || 'https://policestationrepuk.org';

async function main() {
  const auth = resolveKickAuth(process.env);
  if (!auth) {
    console.error('CRON_SECRET or FIRM_OUTREACH_BOOTSTRAP_SECRET required in .env.local');
    process.exit(1);
  }

  const { results, failed } = await runProductionKickSteps({
    baseUrl,
    auth,
    steps: [
      { path: `/api/cron/firm-outreach-send?limit=${limit}`, label: `Live send tick (limit=${limit})` },
    ],
    timeoutMs: 320_000,
  });

  for (const r of results) {
    console.log(`[${r.ok ? 'ok' : 'fail'}] ${r.label} — HTTP ${r.status}`);
    console.log(r.body.slice(0, 8000));
  }

  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
