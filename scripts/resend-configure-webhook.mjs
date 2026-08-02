#!/usr/bin/env node
/**
 * Register or update the Resend webhook for firm outreach email events,
 * and sync RESEND_WEBHOOK_SECRET to Vercel production when credentials allow.
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   node scripts/resend-configure-webhook.mjs
 *   node scripts/resend-configure-webhook.mjs --list
 *   node scripts/resend-configure-webhook.mjs --dry-run
 *   node scripts/resend-configure-webhook.mjs --sync-secret
 */
import fs from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';

const WEBHOOK_URL =
  process.env.RESEND_WEBHOOK_URL_OVERRIDE || 'https://policestationrepuk.org/api/webhooks/resend';

const EVENTS = [
  'email.sent',
  'email.delivered',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
];

const DRY = process.argv.includes('--dry-run');
const LIST_ONLY = process.argv.includes('--list');
const FORCE_SYNC = process.argv.includes('--sync-secret');

function readEnvLocal() {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }
    out[m[1]] = v.trim();
  }
  return out;
}

const fileEnv = readEnvLocal();
function readVar(name) {
  const v = (process.env[name] ?? fileEnv[name] ?? '').toString().trim();
  return v.length ? v : undefined;
}

const apiKey = readVar('RESEND_API_KEY');
if (!apiKey) {
  console.error('Missing RESEND_API_KEY in env or .env.local');
  process.exit(1);
}

const resend = new Resend(apiKey);

function eventsMatch(existing) {
  if (!existing?.length) return false;
  const want = new Set(EVENTS);
  const have = new Set(existing);
  for (const e of want) {
    if (!have.has(e)) return false;
  }
  return true;
}

async function vercelJson(pathname, opts = {}) {
  const token = readVar('VERCEL_TOKEN');
  const projectId = readVar('VERCEL_PROJECT_ID');
  const teamId = readVar('VERCEL_ORG_ID');
  if (!token || !projectId) return null;

  const u = new URL(`https://api.vercel.com${pathname}`);
  if (teamId) u.searchParams.set('teamId', teamId);
  for (const [k, v] of Object.entries(opts.query || {})) {
    if (v != null) u.searchParams.set(k, String(v));
  }
  const res = await fetch(u, {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = typeof data?.error?.message === 'string' ? data.error.message : text.slice(0, 500);
    throw new Error(`Vercel API ${opts.method || 'GET'} ${pathname} → HTTP ${res.status}: ${msg}`);
  }
  return data;
}

async function syncSecretToVercel(signingSecret) {
  if (!signingSecret) {
    console.log('[resend webhook] no signing_secret to sync');
    return { synced: false, reason: 'no_secret' };
  }
  const projectId = readVar('VERCEL_PROJECT_ID');
  if (!readVar('VERCEL_TOKEN') || !projectId) {
    console.log('[resend webhook] VERCEL_TOKEN/VERCEL_PROJECT_ID missing — print secret for manual set');
    console.log(`RESEND_WEBHOOK_SECRET=${signingSecret}`);
    return { synced: false, reason: 'no_vercel' };
  }

  const envJson = await vercelJson(`/v9/projects/${projectId}/env`, {
    query: { decrypt: 'true' },
  });
  const envs = envJson?.envs || [];
  const matches = envs.filter(
    (e) =>
      e.key === 'RESEND_WEBHOOK_SECRET' &&
      (!e.target || e.target.includes('production') || e.target.length === 0),
  );
  const current = matches
    .map((e) => (e.value || '').trim())
    .find((v) => v.length > 0);
  if (current === signingSecret && !FORCE_SYNC) {
    console.log('[resend webhook] RESEND_WEBHOOK_SECRET already matches Resend (len ok)');
    return { synced: false, reason: 'already_current' };
  }

  if (DRY) {
    console.log(
      '[resend webhook] dry-run — would upsert RESEND_WEBHOOK_SECRET on production',
      current ? `(replace len=${current.length})` : '(create)',
    );
    return { synced: false, reason: 'dry_run' };
  }

  for (const entry of matches) {
    if (!entry.id) continue;
    console.log(`[resend webhook] removing stale Vercel env id ${entry.id}`);
    await vercelJson(`/v9/projects/${projectId}/env/${entry.id}`, { method: 'DELETE' });
  }
  console.log(`[resend webhook] creating production RESEND_WEBHOOK_SECRET (${signingSecret.length} chars)`);
  await vercelJson(`/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: {
      key: 'RESEND_WEBHOOK_SECRET',
      value: signingSecret,
      type: 'encrypted',
      target: ['production'],
    },
  });
  console.log('[resend webhook] RESEND_WEBHOOK_SECRET synced to Vercel production — redeploy required');
  return { synced: true, reason: 'updated' };
}

async function ensureWebhook() {
  const { data: listData, error: listError } = await resend.webhooks.list();
  if (listError) {
    console.error('[resend webhook] list failed:', listError);
    process.exit(1);
  }

  const hooks = listData?.data ?? [];
  console.log(`[resend webhook] existing: ${hooks.length}`);
  for (const h of hooks) {
    console.log(`  - ${h.id} ${h.status} ${h.endpoint} [${(h.events ?? []).join(', ')}]`);
  }

  if (LIST_ONLY) return null;

  let ours = hooks.find((h) => h.endpoint === WEBHOOK_URL);

  if (ours && eventsMatch(ours.events) && ours.status === 'enabled') {
    console.log(`[resend webhook] OK — already registered at ${WEBHOOK_URL}`);
  } else if (DRY) {
    console.log('[resend webhook] dry-run — would', ours ? 'update' : 'create', WEBHOOK_URL);
    return null;
  } else if (ours) {
    const { error } = await resend.webhooks.update(ours.id, {
      endpoint: WEBHOOK_URL,
      events: EVENTS,
      status: 'enabled',
    });
    if (error) {
      console.error('[resend webhook] update failed:', error);
      process.exit(1);
    }
    console.log(`[resend webhook] updated ${ours.id}`);
  } else {
    const { data, error } = await resend.webhooks.create({
      endpoint: WEBHOOK_URL,
      events: EVENTS,
    });
    if (error) {
      console.error('[resend webhook] create failed:', error);
      process.exit(1);
    }
    ours = data;
    console.log(`[resend webhook] created ${data.id} → ${WEBHOOK_URL}`);
    if (data.signing_secret) {
      return data.signing_secret;
    }
  }

  if (!ours?.id) return null;
  const { data: detail, error: getError } = await resend.webhooks.get(ours.id);
  if (getError) {
    console.error('[resend webhook] get failed:', getError);
    process.exit(1);
  }
  return detail?.signing_secret ?? null;
}

async function main() {
  const signingSecret = await ensureWebhook();
  if (LIST_ONLY) return;
  if (!signingSecret) {
    console.log('[resend webhook] signing_secret unavailable from Resend API');
    return;
  }
  const result = await syncSecretToVercel(signingSecret);
  if (result.reason === 'no_vercel') {
    console.log('[resend webhook] Add RESEND_WEBHOOK_SECRET to Vercel production env, then redeploy.');
  }
}

main().catch((err) => {
  console.error('[resend webhook] failed:', err);
  process.exit(1);
});
