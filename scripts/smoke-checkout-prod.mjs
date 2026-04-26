#!/usr/bin/env node
// End-to-end smoke for the deployed /api/checkout/featured route:
// 1. Pick a non-featured rep email from data/scraped-reps.json
// 2. Mint a Vercel-side rep_session in Upstash KV directly
// 3. POST to /api/checkout/featured with that cookie
// 4. Expect 200 + a Lemon Squeezy URL
// 5. Clean up the session
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
const BASE = (process.env.BASE || 'https://policestationrepuk.org').replace(/\/$/, '');

if (!KV_URL || !KV_TOKEN) {
  console.error('Missing KV credentials');
  process.exit(2);
}

async function kvSet(key, value, ttl) {
  const url = `${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttl}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
    body: value,
  });
  if (!res.ok) throw new Error(`KV set ${key} -> ${res.status} ${await res.text()}`);
}
async function kvDel(key) {
  await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}

const reps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'scraped-reps.json'), 'utf8'));
const target = reps.find((r) => !r.featured && typeof r.email === 'string' && r.email.includes('@'));
if (!target) {
  console.error('No non-featured rep with email found');
  process.exit(2);
}
const email = target.email.toLowerCase();
console.log(`[smoke] Using non-featured rep: ${target.name} <${email}> (slug=${target.slug})`);

const token = crypto.randomUUID();
const sessionKey = `session:${token}`;
console.log(`[smoke] Minting session ${token.slice(0, 8)}…`);
await kvSet(sessionKey, JSON.stringify({ email, created: Date.now() }), 600);

try {
  console.log(`[smoke] POST ${BASE}/api/checkout/featured`);
  const res = await fetch(`${BASE}/api/checkout/featured`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `rep_session=${token}`,
    },
    body: JSON.stringify({ tier: 'monthly' }),
  });
  const text = await res.text();
  console.log(`[smoke] -> ${res.status}`);
  console.log(text);
  if (res.status !== 200) process.exit(1);
  const json = JSON.parse(text);
  if (!json.url || !json.url.startsWith('https://')) {
    console.error('[smoke] no checkout URL');
    process.exit(1);
  }
  console.log(`[smoke] PASS — production checkout returned: ${json.url}`);
} finally {
  await kvDel(sessionKey).catch(() => {});
}
