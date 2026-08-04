#!/usr/bin/env npx tsx
/**
 * Controlled operator test send via production (or local) probe route.
 * Sends ONLY to FIRM_OUTREACH_DIGEST_EMAIL / OWNER_EMAIL — never arbitrary recipients.
 *
 * Usage:
 *   npm run outreach:test-send
 *   npm run outreach:test-send -- --url=https://policestationrepuk.org
 *   npm run outreach:test-send -- --dry-run
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
  for (const f of ['.env.local', '.vercel/.env.production.local']) {
    loadEnvFile(f);
  }

  const dryRun = process.argv.includes('--dry-run');
  const baseUrl = (
    process.argv.find((a) => a.startsWith('--url='))?.slice(6) ||
    'https://policestationrepuk.org'
  ).replace(/\/$/, '');
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error('CRON_SECRET missing — cannot call protected probe route');
    process.exit(1);
  }

  const path = dryRun
    ? '/api/cron/firm-outreach-probe?dryRun=1'
    : '/api/cron/firm-outreach-probe';
  console.log('POST', `${baseUrl}${path}`);
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep text */
  }
  console.log('HTTP', res.status);
  console.log(JSON.stringify(body, null, 2));

  if (res.status !== 200) process.exit(1);
  const ok =
    typeof body === 'object' &&
    body !== null &&
    'ok' in body &&
    (body as { ok?: boolean }).ok === true;
  if (!dryRun && !ok) {
    console.error('Probe reported failure — check Resend domain / API key');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
