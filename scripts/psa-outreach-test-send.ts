#!/usr/bin/env npx tsx
/** One-off PSA test send to your inbox — does not touch KV queue. */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load KV (and other non-Resend) vars from .env.local without clobbering production Resend.
const envLocalPath = resolve(__dirname, '../.env.local');
try {
  for (const line of readFileSync(envLocalPath, 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq < 0) continue;
  const key = line.slice(0, eq).trim();
  if (key === 'RESEND_API_KEY' || key === 'RESEND_WEBHOOK_SECRET') continue;
  if (process.env[key] !== undefined) continue;
  let value = line.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
  }
} catch {
  // .env.local optional when vercel env run supplies everything needed.
}

const TEST_EMAIL = process.env.TEST_OUTREACH_EMAIL?.trim() || 'robertdavidcashman@gmail.com';

async function main() {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.error(
      '[psa-test-send] RESEND_API_KEY missing. Run: npx vercel env run --environment production -- npx tsx scripts/psa-outreach-test-send.ts',
    );
    process.exit(1);
  }

  const { clearVerifiedDomainsCache, resolveOutreachFromAddress } = await import(
    '../lib/firm-outreach/outreach/from-address'
  );
  const { sendOutreachEmail } = await import('../lib/firm-outreach/outreach/send');
  const { AGENT_COVER_KENT_CAMPAIGN_ID } = await import('../lib/firm-outreach/campaign-scope');

  clearVerifiedDomainsCache();
  const from = await resolveOutreachFromAddress(AGENT_COVER_KENT_CAMPAIGN_ID);
  console.log('[psa-test-send] To:', TEST_EMAIL);
  console.log('[psa-test-send] From:', from.from, '(domain:', from.domain + ')');

  const result = await sendOutreachEmail({
    prospect: {
      id: 'fop_test_run_manual',
      firmKey: 'test-firm-kent',
      firmName: 'Test Criminal Defence LLP',
      prospectType: 'firm',
      status: 'ready_to_send',
      sequenceStep: 0,
      sources: ['manual'],
      priorityScore: 0,
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      enrichAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      email: TEST_EMAIL,
      county: 'Kent',
    },
    step: 0,
  });

  console.log('[psa-test-send] Result:', JSON.stringify(result));
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error('[psa-test-send] failed:', err);
  process.exit(1);
});
