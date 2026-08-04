#!/usr/bin/env node
/**
 * CLI for kick-log evidence (ops-outreach-production-verify).
 *
 * Usage:
 *   node scripts/firm-outreach-verify-kick-evidence.mjs status_only /tmp/outreach-kick.log
 *   node scripts/firm-outreach-verify-kick-evidence.mjs live_send /tmp/outreach-kick.log
 *
 * Delegates to the TypeScript evaluator via tsx (same pattern as other firm-outreach scripts).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const mode = process.argv[2];
const logPath = process.argv[3] || '/tmp/outreach-kick.log';

if (mode !== 'status_only' && mode !== 'live_send') {
  console.error('Usage: firm-outreach-verify-kick-evidence.mjs <status_only|live_send> [logPath]');
  process.exit(2);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsEntry = join(__dirname, 'firm-outreach-verify-kick-evidence.ts');
const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', tsEntry, mode, logPath],
  { stdio: 'inherit', env: process.env },
);

if (result.error) {
  // Fallback: npx tsx
  const fallback = spawnSync('npx', ['tsx', tsEntry, mode, logPath], {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });
  process.exit(fallback.status ?? 1);
}

process.exit(result.status ?? 1);
