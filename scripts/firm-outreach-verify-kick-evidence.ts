#!/usr/bin/env npx tsx
import { readFileSync } from 'node:fs';
import { evaluateKickEvidence, type KickEvidenceMode } from '../lib/firm-outreach/verify-kick-evidence';

const mode = process.argv[2] as KickEvidenceMode | undefined;
const logPath = process.argv[3] || '/tmp/outreach-kick.log';

if (mode !== 'status_only' && mode !== 'live_send') {
  console.error('Usage: firm-outreach-verify-kick-evidence.ts <status_only|live_send> [logPath]');
  process.exit(2);
}

const log = readFileSync(logPath, 'utf8');
const result = evaluateKickEvidence(log, mode);
console.log(JSON.stringify(result));
if (!result.ok) {
  console.error(result.reason);
  process.exit(1);
}
console.log(result.reason);
process.exit(0);
