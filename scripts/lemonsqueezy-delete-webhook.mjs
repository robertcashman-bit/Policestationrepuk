#!/usr/bin/env node
// Delete a Lemon Squeezy webhook by id.
// Usage: node scripts/lemonsqueezy-delete-webhook.mjs <id>
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://api.lemonsqueezy.com/v1';

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
const apiKey = (process.env.LEMON_SQUEEZY_API_KEY || process.env.LEMONSQUEEZY_API_KEY || fileEnv.LEMONSQUEEZY_API_KEY || fileEnv.LEMON_SQUEEZY_API_KEY || '').trim();
const id = process.argv[2];
if (!apiKey) {
  console.error('Missing LEMONSQUEEZY_API_KEY');
  process.exit(2);
}
if (!id) {
  console.error('usage: node scripts/lemonsqueezy-delete-webhook.mjs <id>');
  process.exit(2);
}

const res = await fetch(`${API}/webhooks/${id}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/vnd.api+json' },
});
if (res.status === 204) {
  console.log(`deleted webhook #${id}`);
} else {
  const text = await res.text();
  console.error(`DELETE ${id} -> ${res.status}: ${text}`);
  process.exit(1);
}
