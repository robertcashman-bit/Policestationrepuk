#!/usr/bin/env node
// Cancel a Lemon Squeezy subscription by id.
//
// Usage:
//   SUBSCRIPTION_ID=2098707 node scripts/lemonsqueezy-cancel-subscription.mjs
//
// Reads LEMON_SQUEEZY_API_KEY (or LEMONSQUEEZY_API_KEY) from .env.local.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadDotEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!m) continue;
      const [, k, v] = m;
      if (process.env[k] == null || process.env[k] === '') {
        process.env[k] = v.replace(/^['"]|['"]$/g, '').trim();
      }
    }
  } catch {
    /* ignore */
  }
}

loadDotEnvLocal();

const subId = (process.env.SUBSCRIPTION_ID || process.argv[2] || '').trim();
if (!subId) {
  console.error('SUBSCRIPTION_ID env var (or argv[1]) required');
  process.exit(1);
}

const apiKey = (process.env.LEMON_SQUEEZY_API_KEY || process.env.LEMONSQUEEZY_API_KEY || '').trim();
if (!apiKey) {
  console.error('LEMON_SQUEEZY_API_KEY missing');
  process.exit(1);
}

const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/vnd.api+json',
  },
});

const text = await res.text();
console.log(`status: ${res.status}`);
if (text) {
  try {
    const json = JSON.parse(text);
    const status = json?.data?.attributes?.status;
    const cancelled = json?.data?.attributes?.cancelled;
    const endsAt = json?.data?.attributes?.ends_at;
    console.log(`subscription ${subId}: status=${status} cancelled=${cancelled} ends_at=${endsAt}`);
  } catch {
    console.log(text);
  }
}

if (!res.ok) process.exit(2);
console.log('OK — subscription cancelled.');
