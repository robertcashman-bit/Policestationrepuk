#!/usr/bin/env node
// Reads the featured:<email> KV record produced by the Lemon Squeezy webhook
// and reports whether activation worked. Run after completing the hosted-
// checkout flow.
import fs from 'node:fs';
import path from 'node:path';

function readEnvLocal() {
  const f = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(f)) return {};
  const out = {};
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
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
const TEST_EMAIL = (process.env.TEST_EMAIL || 'cursor-test+featured@policestationrepuk.org').toLowerCase();
if (!KV_URL || !KV_TOKEN) { console.error('Missing KV creds'); process.exit(2); }

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) throw new Error(`KV get ${key} -> ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (json.result == null) return null;
  if (typeof json.result === 'string') {
    try { return JSON.parse(json.result); } catch { return json.result; }
  }
  return json.result;
}

const meta = await kvGet(`featured:${TEST_EMAIL}`);
if (!meta) {
  console.error(`!! No featured:${TEST_EMAIL} record found.`);
  console.error('   Either the checkout was not completed yet, or the webhook has not arrived.');
  console.error('   Tip: check Lemon Squeezy dashboard -> Webhooks -> Logs');
  process.exit(1);
}

console.log(`featured:${TEST_EMAIL} =`);
console.log(JSON.stringify(meta, null, 2));

const ok =
  meta.status === 'active' &&
  meta.isFeatured === true &&
  !meta.isLegacyFeatured &&
  Boolean(meta.lemonSqueezySubscriptionId || meta.subscriptionId);

if (ok) {
  console.log('\nPASS — webhook activated the rep. Real payment flow is wired up correctly.');
  console.log(`  status              : ${meta.status}`);
  console.log(`  expiresAt           : ${meta.expiresAt}`);
  console.log(`  subscription id     : ${meta.lemonSqueezySubscriptionId || meta.subscriptionId}`);
  console.log(`  customer id         : ${meta.lemonSqueezyCustomerId || meta.customerId}`);
  console.log(`  last webhook event  : ${meta.featuredLastWebhookEvent}`);
} else {
  console.error('\n!! FAIL — KV record exists but is not in the expected state.');
  process.exit(2);
}
