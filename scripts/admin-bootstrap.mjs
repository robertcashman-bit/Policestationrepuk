#!/usr/bin/env node
// Bootstrap admin call by injecting a session token into Upstash KV directly,
// then calling the protected admin endpoint with the rep_session cookie.
// Cleans up the session after use.
//
// Usage:
//   node scripts/admin-bootstrap.mjs                  # GET /api/admin/featured
//   node scripts/admin-bootstrap.mjs --migrate        # POST /api/admin/featured
//   node scripts/admin-bootstrap.mjs --base https://policestationrepuk.org
//   node scripts/admin-bootstrap.mjs --email someone@x.com

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
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }
    out[m[1]] = v.trim();
  }
  return out;
}

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(name);
  if (i === -1) return def;
  return args[i + 1] ?? true;
}

const fileEnv = readEnvLocal();
const v = (k) => (process.env[k] ?? fileEnv[k] ?? '').toString().trim() || undefined;

const KV_URL = v('KV_REST_API_URL');
const KV_TOKEN = v('KV_REST_API_TOKEN');
const BASE = (flag('--base') || 'https://policestationrepuk.org').replace(/\/$/, '');
const EMAIL = (flag('--email') || 'robertdavidcashman@gmail.com').toLowerCase();
const COOKIE_NAME = 'rep_session';
const SESSION_TTL = 600; // 10 minutes
const MIGRATE = args.includes('--migrate');

if (!KV_URL || !KV_TOKEN) {
  console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN in env or .env.local');
  process.exit(2);
}

async function kvSet(key, value, ttl) {
  // Upstash REST: POST {KV_URL}/set/{key}/{value}?EX={ttl}
  // We need to send raw value as body for safety.
  const url = `${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttl}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
    body: typeof value === 'string' ? value : JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`KV set ${key} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function kvDel(key) {
  const url = `${KV_URL}/del/${encodeURIComponent(key)}`;
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  if (!res.ok) throw new Error(`KV del ${key} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const token = crypto.randomUUID();
  const sessionKey = `session:${token}`;
  const sessionData = JSON.stringify({ email: EMAIL, created: Date.now() });

  console.log(`[admin] Minting session for ${EMAIL} (token=${token.slice(0, 8)}...)`);
  await kvSet(sessionKey, sessionData, SESSION_TTL);

  try {
    const url = `${BASE}/api/admin/featured`;
    const method = MIGRATE ? 'POST' : 'GET';
    console.log(`[admin] ${method} ${url}`);
    const res = await fetch(url, {
      method,
      headers: { Cookie: `${COOKIE_NAME}=${token}` },
    });
    const text = await res.text();
    console.log(`[admin] -> ${res.status}`);
    try {
      const obj = JSON.parse(text);
      console.dir(obj, { depth: 5 });
    } catch {
      console.log(text);
    }
  } finally {
    console.log(`[admin] cleaning up session token`);
    await kvDel(sessionKey).catch((err) => console.warn('cleanup failed:', err.message));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
