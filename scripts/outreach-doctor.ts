#!/usr/bin/env npx tsx
/**
 * Outreach health doctor — env / KV / Resend / queue / cron readiness.
 * Never prints secret values.
 *
 * Usage: npm run outreach:doctor
 *        npm run outreach:doctor -- --url https://policestationrepuk.org
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateOutreachEnv, resendOutreachBudget } from '@robertcashman/firm-outreach-core';
import { getOutreachConfigStatus } from '../lib/firm-outreach/config-status';
import {
  countEmailJobsByStatus,
  listEmailJobIdsByStatus,
} from '../lib/firm-outreach/email-jobs/storage';
import { getIndexRedisType, getLatestOutreachRunLog } from '../lib/firm-outreach/storage';
import { OUTREACH_CAMPAIGN_IDS } from '../lib/firm-outreach/site-config';

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

function present(name: string): string {
  const v = process.env[name]?.trim();
  return v ? `present(len=${v.length})` : 'MISSING';
}

async function main() {
  for (const f of ['.env.local', '.vercel/.env.production.local', '.env.vercel.production']) {
    loadEnvFile(f);
  }

  const baseUrl =
    process.argv.find((a) => a.startsWith('--url='))?.slice(6) ||
    process.env.FIRM_OUTREACH_VERIFY_URL ||
    'https://policestationrepuk.org';

  console.log('==> Environment (names only)');
  for (const k of [
    'RESEND_API_KEY',
    'RESEND_WEBHOOK_SECRET',
    'CRON_SECRET',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'FIRM_OUTREACH_FROM_EMAIL',
    'FIRM_OUTREACH_PSA_FROM_EMAIL',
    'FIRM_OUTREACH_DIGEST_EMAIL',
    'FIRM_OUTREACH_DAILY_CAP',
    'FIRM_OUTREACH_DRY_RUN',
    'FIRM_OUTREACH_REQUIRE_APPROVAL',
    'FIRM_OUTREACH_PAUSED',
    'FIRM_OUTREACH_SEND_ENABLED',
    'ADMIN_DECISION_TOKEN_SECRET',
  ]) {
    console.log(`  ${k}: ${present(k)}`);
  }

  const envCheck = validateOutreachEnv({ requireCronSecret: true });
  console.log('\n==> validateOutreachEnv');
  console.log('  ok:', envCheck.ok);
  for (const e of envCheck.errors ?? []) console.log('  ERROR:', e);
  for (const w of envCheck.warnings ?? []) console.log('  WARN:', w);

  console.log('\n==> Local KV / Resend config');
  const config = await getOutreachConfigStatus();
  console.log(
    JSON.stringify(
      {
        kvConfigured: config.kvConfigured,
        resendConfigured: config.resendConfigured,
        sendHealthy: config.sendHealthy,
        sendBlockers: config.sendBlockers,
        dryRun: config.dryRun,
        dailyCap: config.dailyCap,
        resendQuotaRemaining: config.resendQuotaRemaining,
        resendOutreachBudget: resendOutreachBudget(),
        verifiedResendDomains: config.verifiedResendDomains,
        effectivePaused: config.effectivePaused,
      },
      null,
      2,
    ),
  );

  console.log('\n==> Durable email jobs');
  const jobs = await countEmailJobsByStatus();
  console.log(JSON.stringify(jobs, null, 2));
  const pendingSample = await listEmailJobIdsByStatus('pending', 5);
  console.log('  pending sample ids:', pendingSample);

  console.log('\n==> Index types');
  for (const key of [
    'firmprospect:status:ready_to_send',
    'firmprospect:status:discovered',
    'firmoutreach:job:status:pending',
  ]) {
    console.log(`  ${key}:`, await getIndexRedisType(key));
  }

  console.log('\n==> Latest run logs');
  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    const log = await getLatestOutreachRunLog(campaignId);
    console.log(
      campaignId,
      log
        ? {
            startedAt: log.startedAt,
            sent: log.sent,
            jobsClaimed: (log as { jobsClaimed?: number }).jobsClaimed,
            suppressed: log.suppressed,
            skipReasons: log.skipReasons,
          }
        : null,
    );
  }

  console.log('\n==> Production HTTP status');
  const cron = process.env.CRON_SECRET?.trim();
  if (!cron) {
    console.log('  SKIP (CRON_SECRET missing locally)');
  } else {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/cron/firm-outreach-status`, {
      headers: { Authorization: `Bearer ${cron}` },
    });
    const body = await res.json().catch(() => ({}));
    console.log('  HTTP', res.status);
    console.log(
      JSON.stringify(
        {
          ok: body.ok,
          warnings: body.warnings,
          queue: body.queue
            ? {
                readyToSend: body.queue.readyToSend,
                sendableReady: body.queue.sendableReady,
                sentToday: body.queue.sentToday,
              }
            : undefined,
          jobs: body.jobs,
        },
        null,
        2,
      ),
    );
  }

  const failed = !envCheck.ok || !config.kvConfigured || !config.resendConfigured;
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
