#!/usr/bin/env node
/**
 * Post-deploy production kick for firm outreach (used by GitHub Actions).
 *
 * Runs after Deploy to Vercel (production) succeeds — including when promote
 * reports the deployment is already production (alias already correct).
 *
 * Usage:
 *   FIRM_OUTREACH_KICK_BASE_URL=https://policestationrepuk.org \
 *   CRON_SECRET=... node scripts/firm-outreach-production-kick.mjs
 *
 * Optionally loads `.env.production` (from `vercel env pull`) via dotenv so
 * bash `source` quoting/expansion cannot drop CRON_SECRET.
 */
import { existsSync, readFileSync } from 'node:fs';
import {
  DEFAULT_PRODUCTION_KICK_STEPS,
  productionKickStepsWithFlushLimit,
  resolveKickAuth,
  runProductionKickSteps,
  STATUS_ONLY_PRODUCTION_KICK_STEPS,
  waitForVercelProductionDeploy,
} from '../lib/firm-outreach/production-kick.ts';
import { probeSignedResendWebhook } from '../lib/firm-outreach/resend-webhook-probe.ts';

function parseDotenv(src) {
  const text = Buffer.isBuffer(src) ? src.toString('utf8') : String(src ?? '');
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;

    const key = match[1];
    let value = match[2] ?? '';

    // If value is unquoted, strip inline comments.
    const firstChar = value.trimStart().slice(0, 1);
    const isQuoted = firstChar === '"' || firstChar === "'";
    if (!isQuoted) {
      value = value.replace(/\s+#.*$/, '');
    }

    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadEnvFileIfPresent(path) {
  if (!existsSync(path)) return { loaded: false, filled: [] };
  const parsed = parseDotenv(readFileSync(path));
  const filled = [];
  for (const [key, value] of Object.entries(parsed)) {
    const current = process.env[key];
    // Fill missing/empty only — never overwrite a non-empty GH secret.
    if (current == null || current === '') {
      process.env[key] = value;
      if (value) filled.push(key);
    }
  }
  return { loaded: true, filled };
}

const envLoad = loadEnvFileIfPresent('.env.production');
if (envLoad.loaded) {
  console.log(
    `Loaded .env.production (filled empty keys: ${envLoad.filled.length}; cron_len=${(process.env.CRON_SECRET || '').length})`,
  );
}

const baseUrl = process.env.FIRM_OUTREACH_KICK_BASE_URL?.trim();
if (!baseUrl) {
  console.error('FIRM_OUTREACH_KICK_BASE_URL is required');
  process.exit(1);
}

const auth = resolveKickAuth(process.env);
if (!auth) {
  const requireAuth = process.env.FIRM_OUTREACH_KICK_REQUIRE_AUTH === '1';
  console.error('No CRON_SECRET or FIRM_OUTREACH_BOOTSTRAP_SECRET after env load');
  if (requireAuth) {
    console.error(
      'Set repository secret CRON_SECRET (same value as Vercel production) or FIRM_OUTREACH_BOOTSTRAP_SECRET.',
    );
    process.exit(1);
  }
  console.log('Skipping kick (auth optional in this context)');
  process.exit(0);
}

const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();
const teamId = process.env.VERCEL_ORG_ID?.trim();
const commitSha = process.env.FIRM_OUTREACH_KICK_COMMIT_SHA?.trim();

if (token && projectId) {
  console.log('Waiting for Vercel production deploy…');
  const deploy = await waitForVercelProductionDeploy({
    token,
    projectId,
    teamId: teamId || undefined,
    commitSha: commitSha || undefined,
    timeoutMs: Number(process.env.FIRM_OUTREACH_KICK_DEPLOY_WAIT_MS || 600_000),
  });
  if (deploy.ready) {
    console.log('Production deploy ready', deploy.deployment?.url ?? '');
  } else {
    console.warn('Deploy wait timed out — continuing with kick anyway');
  }
}

const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
// Vercel env API sometimes leaves ciphertext (eyJ…) in GITHUB_ENV when decrypt
// fails — never feed that to Standard Webhooks.
if (!webhookSecret) {
  console.warn(
    'RESEND_WEBHOOK_SECRET missing after prepare — skipping signed webhook probe; continuing send flush',
  );
} else if (!webhookSecret.startsWith('whsec_')) {
  console.warn(
    `RESEND_WEBHOOK_SECRET looks undecrypted (prefix=${webhookSecret.slice(0, 4)}…) — skipping signed webhook probe; continuing send flush`,
  );
} else {
  console.log('Probing signed Resend webhook on production…');
  const probe = await probeSignedResendWebhook({
    baseUrl,
    webhookSecret,
  });
  console.log(
    `[${probe.ok ? 'ok' : 'warn'}] Signed Resend webhook probe — HTTP ${probe.status}`,
  );
  if (probe.body) console.log(probe.body.slice(0, 500));
  if (!probe.ok) {
    // Do not block the send flush on a webhook probe timeout/drift — delivery
    // reconciliation is best-effort; outreach send is the kick's primary job.
    console.warn(
      'Signed webhook probe failed — continuing kick (send flush). Check RESEND_WEBHOOK_SECRET /api/webhooks/resend if delivery status stalls.',
    );
  }
}

const statusOnly = process.env.FIRM_OUTREACH_KICK_STATUS_ONLY === '1';
const flushLimitRaw = process.env.FIRM_OUTREACH_KICK_FLUSH_LIMIT?.trim();
const flushLimit = flushLimitRaw ? Number(flushLimitRaw) : NaN;
const steps = statusOnly
  ? STATUS_ONLY_PRODUCTION_KICK_STEPS
  : Number.isFinite(flushLimit) && flushLimit > 0
    ? productionKickStepsWithFlushLimit(flushLimit)
    : DEFAULT_PRODUCTION_KICK_STEPS;

const { results, failed } = await runProductionKickSteps({
  baseUrl,
  auth,
  steps,
});

for (const r of results) {
  const tag = r.ok ? 'ok' : r.optional ? 'warn' : 'fail';
  console.log(`[${tag}] ${r.label} — HTTP ${r.status}`);
  if (r.body) console.log(r.body.slice(0, 4000));
}

process.exit(failed ? 1 : 0);
