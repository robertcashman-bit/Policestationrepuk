#!/usr/bin/env npx tsx
/**
 * Recover abandoned claimed/processing email jobs (expired leases).
 *
 * Usage: npm run outreach:recover-stale
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { recoverAbandonedEmailJobs } from '../lib/firm-outreach/email-jobs/storage';

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
  for (const f of ['.env.local', '.vercel/.env.production.local']) {
    loadEnvFile(f);
  }
  const recovered = await recoverAbandonedEmailJobs({ limit: 200 });
  console.log(JSON.stringify({ recovered }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
