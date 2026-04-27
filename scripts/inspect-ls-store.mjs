#!/usr/bin/env node
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
const apiKey = env.LEMONSQUEEZY_API_KEY || env.LEMON_SQUEEZY_API_KEY;
const storeId = env.LEMONSQUEEZY_STORE_ID || env.LEMON_SQUEEZY_STORE_ID || '351887';
const monthly = env.LEMONSQUEEZY_VARIANT_MONTHLY || '1576223';

const headers = { Accept: 'application/vnd.api+json', Authorization: `Bearer ${apiKey}` };

const store = await fetch(`https://api.lemonsqueezy.com/v1/stores/${storeId}`, { headers }).then((r) => r.json());
const variant = await fetch(`https://api.lemonsqueezy.com/v1/variants/${monthly}`, { headers }).then((r) => r.json());

const sa = store.data?.attributes ?? {};
const va = variant.data?.attributes ?? {};

console.log('STORE');
console.log('  name        :', sa.name);
console.log('  domain      :', sa.url || sa.domain);
console.log('  country     :', sa.country);
console.log('  currency    :', sa.currency);
console.log('  plan        :', sa.plan);

console.log('\nVARIANT (monthly)');
console.log('  name        :', va.name);
console.log('  status      :', va.status);
console.log('  test_mode   :', va.test_mode);
console.log('  price       :', va.price, va.is_subscription ? '(subscription)' : '(one-off)');
console.log('  interval    :', va.interval, va.interval_count);
console.log('  product_id  :', va.product_id);
