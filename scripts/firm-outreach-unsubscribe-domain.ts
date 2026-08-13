#!/usr/bin/env npx tsx
/**
 * Unsubscribe every firm-outreach prospect whose email is on a given domain.
 * Mirrors the public unsubscribe page: suppression reason `unsubscribe` + prospect status.
 *
 *   npx tsx scripts/firm-outreach-unsubscribe-domain.ts --domain=hpjv.co.uk
 *   npx tsx scripts/firm-outreach-unsubscribe-domain.ts --domain=hpjv.co.uk --dry-run
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env.vercel.production') });
config({ path: resolve(__dirname, '../.env.production.local') });

function argValue(flag: string): string | undefined {
  const pref = `${flag}=`;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith(pref)) return a.slice(pref.length).trim();
    if (a === flag) {
      const i = process.argv.indexOf(a);
      return process.argv[i + 1];
    }
  }
  return undefined;
}

async function main() {
  const domainRaw = argValue('--domain') ?? argValue('-d');
  const dryRun = process.argv.includes('--dry-run');
  if (!domainRaw) {
    console.error('Usage: --domain=example.co.uk [--dry-run]');
    process.exit(2);
  }
  const domain = domainRaw.toLowerCase().replace(/^@/, '').trim();
  if (!domain.includes('.')) {
    console.error('Invalid domain:', domain);
    process.exit(2);
  }

  const {
    addSuppression,
    getProspect,
    getSuppression,
    listAllProspectIds,
    saveProspect,
  } = await import('../lib/firm-outreach/storage');
  const { getKV } = await import('../lib/kv');

  if (!getKV()) {
    console.error(
      '[unsubscribe-domain] KV not configured (need KV_REST_API_URL / KV_REST_API_TOKEN)',
    );
    process.exit(1);
  }

  const ids = await listAllProspectIds();
  const matched: Array<{
    id: string;
    email: string;
    firmName: string;
    prevStatus: string;
    alreadySuppressed: boolean;
  }> = [];

  for (const id of ids) {
    const p = await getProspect(id);
    if (!p?.email) continue;
    const email = p.email.trim().toLowerCase();
    if (!email.endsWith(`@${domain}`)) continue;
    const existing = await getSuppression(email);
    matched.push({
      id: p.id,
      email,
      firmName: p.firmName,
      prevStatus: p.status,
      alreadySuppressed: Boolean(existing),
    });
  }

  // Always ensure the shared inbox is suppressed even if no prospect row exists.
  const knownShared = `enquiries@${domain}`;
  const emails = new Set(matched.map((m) => m.email));
  emails.add(knownShared);

  console.log(
    JSON.stringify(
      {
        domain,
        dryRun,
        prospectMatches: matched.length,
        emailsToSuppress: [...emails].sort(),
        prospects: matched,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log('[unsubscribe-domain] dry-run — no writes');
    return;
  }

  for (const email of emails) {
    await addSuppression(email, 'unsubscribe');
    console.log('[unsubscribe-domain] suppressed', email);
  }

  for (const row of matched) {
    const prospect = await getProspect(row.id);
    if (!prospect) continue;
    if (prospect.status === 'unsubscribed') {
      console.log('[unsubscribe-domain] already unsubscribed', row.id, row.email);
      continue;
    }
    const prev = prospect.status;
    prospect.status = 'unsubscribed';
    prospect.updatedAt = new Date().toISOString();
    await saveProspect(prospect, prev);
    console.log('[unsubscribe-domain] prospect', row.id, prev, '-> unsubscribed');
  }

  console.log('[unsubscribe-domain] done', {
    suppressedEmails: emails.size,
    prospectsUpdated: matched.length,
  });
}

main().catch((err) => {
  console.error('[unsubscribe-domain] failed:', err);
  process.exit(1);
});
