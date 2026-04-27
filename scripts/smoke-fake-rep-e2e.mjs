#!/usr/bin/env node
// End-to-end production smoke for the featured-rep system using a synthetic
// rep + signed-webhook simulation (no real card needed).
//
// Lifecycle covered:
//   1. Create fake rep newrep:<TEST_EMAIL>
//   2. Mint rep_session for that email
//   3. POST /api/checkout/featured -> assert real Lemon Squeezy URL
//   4. Delete the fake newrep (so webhook activations don't email anyone)
//   5. POST signed subscription_created -> assert featured:<email> active
//   6. POST signed subscription_cancelled -> assert status: cancelled
//   7. POST signed subscription_expired -> assert isFeatured: false / expired
//   8. Cleanup: featured:<email>, session:<token>, lemonsqueezy:webhook:* ids
//
// Reads creds from .env.local (KV + LEMONSQUEEZY_WEBHOOK_SECRET) and runs
// against BASE (default https://policestationrepuk.org).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function readEnvLocal() {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    out[m[1]] = v.trim();
  }
  return out;
}

const env = { ...readEnvLocal(), ...process.env };
const KV_URL = env.KV_REST_API_URL;
const KV_TOKEN = env.KV_REST_API_TOKEN;
const WEBHOOK_SECRET =
  env.LEMON_SQUEEZY_WEBHOOK_SECRET || env.LEMONSQUEEZY_WEBHOOK_SECRET;
const BASE = (process.env.BASE || 'https://policestationrepuk.org').replace(/\/$/, '');
const TEST_EMAIL = (process.env.TEST_EMAIL || 'smoketest+featured@policestationrepuk.org').toLowerCase();
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/api/lemon-squeezy/webhook';

if (!KV_URL || !KV_TOKEN) {
  console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN');
  process.exit(2);
}
if (!WEBHOOK_SECRET) {
  console.error('Missing LEMONSQUEEZY_WEBHOOK_SECRET');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Upstash REST helpers
// ---------------------------------------------------------------------------
async function kvSet(key, value, ttl) {
  const url = new URL(`${KV_URL}/set/${encodeURIComponent(key)}`);
  if (ttl) url.searchParams.set('EX', String(ttl));
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
    body: typeof value === 'string' ? value : JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`KV set ${key} -> ${res.status} ${await res.text()}`);
}
async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) throw new Error(`KV get ${key} -> ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (json.result == null) return null;
  if (typeof json.result === 'string') {
    try {
      return JSON.parse(json.result);
    } catch {
      return json.result;
    }
  }
  return json.result;
}
async function kvDel(key) {
  await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Webhook payload + signing
// ---------------------------------------------------------------------------
function sign(body) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
}

function buildEvent({ eventName, webhookId, status, endsAt, cancelled = false }) {
  const now = new Date();
  return {
    meta: {
      event_name: eventName,
      webhook_id: webhookId,
      custom_data: {
        email: TEST_EMAIL,
        userId: TEST_EMAIL,
        repId: `newrep:${TEST_EMAIL}`,
        repSlug: 'smoke-test-fake-rep',
        tier: 'monthly',
      },
    },
    data: {
      id: 'sub_smoke_999999',
      type: 'subscription',
      attributes: {
        store_id: 351887,
        customer_id: 1234567,
        order_id: 9999991,
        product_id: 7777771,
        variant_id: 1576223,
        user_email: TEST_EMAIL,
        user_name: 'Smoke Test',
        status,
        ends_at: endsAt,
        renews_at: endsAt,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        cancelled,
      },
    },
  };
}

async function postWebhook(event) {
  const body = JSON.stringify(event);
  const signature = sign(body);
  const res = await fetch(`${BASE}${WEBHOOK_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'X-Signature': signature,
    },
    body,
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

// ---------------------------------------------------------------------------
// Test phases
// ---------------------------------------------------------------------------
const NEWREP_KEY = `newrep:${TEST_EMAIL}`;
const FEATURED_KEY = `featured:${TEST_EMAIL}`;
const sessionToken = crypto.randomUUID();
const SESSION_KEY = `session:${sessionToken}`;
const webhookIds = [
  `smoke-test-created-${Date.now()}`,
  `smoke-test-cancelled-${Date.now()}`,
  `smoke-test-expired-${Date.now()}`,
];

const results = [];
function log(step, status, info = '') {
  const tag = status === 'PASS' ? '[OK ]' : status === 'INFO' ? '[ . ]' : '[!! ]';
  results.push({ step, status, info });
  console.log(`${tag} ${step}${info ? `  -- ${info}` : ''}`);
}

async function run() {
  console.log('=== featured-system end-to-end smoke ===');
  console.log(`base:    ${BASE}`);
  console.log(`email:   ${TEST_EMAIL}`);
  console.log(`webhook: ${WEBHOOK_PATH}`);
  console.log('');

  // 1. Create fake newrep
  await kvSet(NEWREP_KEY, {
    name: 'Smoke Test (DELETE ME)',
    email: TEST_EMAIL,
    phone: '00000000000',
    accreditation: 'Accredited Representative',
    counties: 'Kent',
    stations: 'Maidstone Police Station',
    availability: '24/7',
    message: 'Synthetic smoke-test rep. Safe to delete.',
    registeredAt: new Date().toISOString(),
  });
  log('Created fake newrep', 'PASS', NEWREP_KEY);

  // 2. Mint session
  await kvSet(SESSION_KEY, JSON.stringify({ email: TEST_EMAIL, created: Date.now() }), 600);
  log('Minted rep_session', 'PASS', `token=${sessionToken.slice(0, 8)}…`);

  // 3. Checkout
  {
    const res = await fetch(`${BASE}/api/checkout/featured`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `rep_session=${sessionToken}` },
      body: JSON.stringify({ tier: 'monthly' }),
    });
    const text = await res.text();
    if (res.status !== 200) throw new Error(`checkout returned ${res.status}: ${text}`);
    const json = JSON.parse(text);
    if (!json.url || !json.url.startsWith('https://')) throw new Error(`no checkout url: ${text}`);
    log('Checkout returned Lemon Squeezy URL', 'PASS', json.url);
  }

  // 4. Delete fake newrep so webhook activations don't email anyone
  await kvDel(NEWREP_KEY);
  log('Removed fake newrep before webhook tests', 'PASS', '(prevents owner/rep emails firing)');

  // 5. subscription_created
  {
    const ends = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const event = buildEvent({
      eventName: 'subscription_created',
      webhookId: webhookIds[0],
      status: 'active',
      endsAt: ends,
    });
    const { status, body } = await postWebhook(event);
    if (status !== 200) throw new Error(`subscription_created -> ${status}: ${body}`);
    const meta = await kvGet(FEATURED_KEY);
    if (!meta) throw new Error('No featured KV record after subscription_created');
    if (meta.status !== 'active' || meta.isFeatured !== true) {
      throw new Error(`Bad meta after created: ${JSON.stringify(meta)}`);
    }
    if (meta.isLegacyFeatured) throw new Error('paid sub should not be marked legacy');
    if (meta.lemonSqueezySubscriptionId !== 'sub_smoke_999999') {
      throw new Error(`subscriptionId not stored: ${JSON.stringify(meta)}`);
    }
    log('subscription_created -> active', 'PASS', `expiresAt=${meta.expiresAt}`);
  }

  // 6. subscription_cancelled
  {
    const ends = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const event = buildEvent({
      eventName: 'subscription_cancelled',
      webhookId: webhookIds[1],
      status: 'cancelled',
      endsAt: ends,
      cancelled: true,
    });
    const { status, body } = await postWebhook(event);
    if (status !== 200) throw new Error(`subscription_cancelled -> ${status}: ${body}`);
    const meta = await kvGet(FEATURED_KEY);
    if (meta.status !== 'cancelled') {
      throw new Error(`Expected cancelled, got ${JSON.stringify(meta)}`);
    }
    log('subscription_cancelled -> cancelled', 'PASS', `featuredExpiryDate=${meta.featuredExpiryDate}`);
  }

  // 7. subscription_expired
  {
    const event = buildEvent({
      eventName: 'subscription_expired',
      webhookId: webhookIds[2],
      status: 'expired',
      endsAt: new Date().toISOString(),
      cancelled: true,
    });
    const { status, body } = await postWebhook(event);
    if (status !== 200) throw new Error(`subscription_expired -> ${status}: ${body}`);
    const meta = await kvGet(FEATURED_KEY);
    if (meta.status !== 'expired' || meta.isFeatured !== false) {
      throw new Error(`Expected expired+!isFeatured, got ${JSON.stringify(meta)}`);
    }
    log('subscription_expired -> expired/!isFeatured', 'PASS');
  }

  // 7b. Idempotency
  {
    const event = buildEvent({
      eventName: 'subscription_created',
      webhookId: webhookIds[0], // same id as step 5
      status: 'active',
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const { status, body } = await postWebhook(event);
    if (status !== 200) throw new Error(`replay returned ${status}: ${body}`);
    let payload;
    try { payload = JSON.parse(body); } catch { payload = {}; }
    if (!payload.duplicate) throw new Error(`expected duplicate flag, got: ${body}`);
    log('Idempotency: replayed webhook_id ignored', 'PASS', body);
  }

  // 7c. Bad signature rejected
  {
    const body = JSON.stringify(buildEvent({
      eventName: 'subscription_created',
      webhookId: 'should-never-process',
      status: 'active',
      endsAt: new Date().toISOString(),
    }));
    const res = await fetch(`${BASE}${WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.api+json', 'X-Signature': 'deadbeef'.repeat(8) },
      body,
    });
    if (res.status !== 401) throw new Error(`bad signature should be 401, got ${res.status}`);
    log('Invalid signature rejected', 'PASS', '401');
  }
}

async function cleanup() {
  console.log('\n=== cleanup ===');
  await kvDel(NEWREP_KEY);
  await kvDel(FEATURED_KEY);
  await kvDel(SESSION_KEY);
  for (const id of webhookIds) {
    await kvDel(`lemonsqueezy:webhook:${id}`);
  }
  // Leftover safety: also wipe any session shaped like ours
  log('Cleaned KV records', 'INFO', `${NEWREP_KEY}, ${FEATURED_KEY}, ${SESSION_KEY}, lemonsqueezy:webhook:* x${webhookIds.length}`);

  // Verify clean
  const leftovers = [];
  if (await kvGet(NEWREP_KEY)) leftovers.push(NEWREP_KEY);
  if (await kvGet(FEATURED_KEY)) leftovers.push(FEATURED_KEY);
  if (await kvGet(SESSION_KEY)) leftovers.push(SESSION_KEY);
  if (leftovers.length) {
    console.error('!! cleanup did not remove:', leftovers);
    process.exitCode = 3;
  } else {
    log('Verified KV is clean', 'PASS');
  }
}

let runError;
try {
  await run();
} catch (err) {
  runError = err;
  console.error('\n!! run failed:', err.message || err);
} finally {
  await cleanup();
}

console.log('\n=== summary ===');
const passes = results.filter((r) => r.status === 'PASS').length;
const fails = results.filter((r) => r.status === 'FAIL').length;
console.log(`PASS: ${passes}   FAIL: ${fails}`);
if (runError) {
  console.error('OVERALL: FAIL');
  process.exit(1);
}
console.log('OVERALL: PASS');
