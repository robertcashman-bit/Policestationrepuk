#!/usr/bin/env npx tsx
/**
 * Forget prior firm-outreach sends (keep suppressions).
 *
 * Dry-run (default):
 *   npm run outreach:reset-send-history
 *
 * Apply:
 *   npm run outreach:reset-send-history -- --apply
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  for (const f of [
    '.env.local',
    '.vercel/.env.production.local',
    '.env.vercel.production',
  ]) {
    loadEnvFile(f);
  }

  const apply = process.argv.includes('--apply');
  const { resetFirmOutreachSendHistory } = await import(
    '../lib/firm-outreach/reset-send-history'
  );

  console.log(apply ? '==> APPLY reset-send-history' : '==> DRY-RUN reset-send-history');
  const stats = await resetFirmOutreachSendHistory({
    dryRun: !apply,
    ensurePaused: true,
  });
  console.log(JSON.stringify(stats, null, 2));

  if (!apply) {
    console.log('\nRe-run with --apply to mutate production KV.');
  } else {
    console.log('\nReset applied. Outreach remains admin-paused until you unpause.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
