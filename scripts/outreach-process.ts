#!/usr/bin/env npx tsx
/**
 * Trigger a bounded production send tick (processes durable pending jobs first).
 *
 * Usage:
 *   npm run outreach:process
 *   npm run outreach:process -- --limit=5
 *   npm run outreach:process -- --url=https://policestationrepuk.org --limit=10
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
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = Number(limitArg?.slice(8) || 5);
  if (!Number.isFinite(limit) || limit < 1 || limit > 50) {
    console.error('--limit must be 1..50');
    process.exit(1);
  }
  const baseUrl = (
    process.argv.find((a) => a.startsWith('--url='))?.slice(6) ||
    'https://policestationrepuk.org'
  ).replace(/\/$/, '');
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error('CRON_SECRET missing');
    process.exit(1);
  }

  const url = `${baseUrl}/api/cron/firm-outreach-send?limit=${limit}`;
  console.log('GET', url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.json().catch(async () => ({ raw: await res.text() }));
  console.log('HTTP', res.status);
  const send = (body as { send?: Record<string, unknown> }).send;
  console.log(
    JSON.stringify(
      {
        ok: (body as { ok?: boolean }).ok,
        mode: (body as { mode?: string }).mode,
        send: send
          ? {
              sent: send.sent,
              accepted: send.accepted,
              jobsClaimed: send.jobsClaimed,
              jobsCreated: send.jobsCreated,
              suppressed: send.suppressed,
              skipped: send.skipped,
              errors: send.errors,
              partial: send.partial,
              resendQuotaRemaining: send.resendQuotaRemaining,
              runId: send.runId,
            }
          : undefined,
        agentCoverSend: (body as { agentCoverSend?: unknown }).agentCoverSend,
      },
      null,
      2,
    ),
  );
  process.exit(res.status === 200 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
