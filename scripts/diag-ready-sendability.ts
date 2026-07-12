#!/usr/bin/env npx tsx
/**
 * Read-only diagnostic (default) of ready_to_send sendability, or --apply to reconcile
 * stale-ready rows (already-emailed step-0 rows stuck at ready_to_send) to sent via a
 * record-truth scan (independent of the possibly-stale status index).
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  for (const line of readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[key] = v;
  }
} catch {
  /* optional */
}

const APPLY = process.argv.includes('--apply');

async function main() {
  const { listProspectsByRecordStatus, saveProspect } = await import('../lib/firm-outreach/storage');
  for (const campaignId of ['whatsapp_invite_v1', 'agent_cover_kent_v1']) {
    const ready = await listProspectsByRecordStatus('ready_to_send', 3000, { campaignId });
    let step0 = 0;
    let stale = 0;
    let reconciled = 0;
    for (const p of ready) {
      if (p.sequenceStep === 0 && !p.lastEmailAt) {
        step0++;
      } else if (p.lastEmailAt) {
        stale++;
        if (APPLY) {
          p.status = 'sent';
          p.updatedAt = new Date().toISOString();
          await saveProspect(p, 'ready_to_send');
          reconciled++;
        }
      }
    }
    console.log(
      `${campaignId} | ready: ${ready.length} | step0-sendable: ${step0} | stale-ready: ${stale}` +
        (APPLY ? ` | reconciled->sent: ${reconciled}` : ''),
    );
  }
}

main().catch((err) => {
  console.error('diag failed:', err);
  process.exit(1);
});
