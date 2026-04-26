#!/usr/bin/env node
// List / create / update the Lemon Squeezy webhook so it points at the live
// site and subscribes to the events the app handles. Idempotent.
//
// Reads .env.local for credentials so it works locally; falls back to env.
// Usage:
//   node scripts/lemonsqueezy-configure-webhook.mjs            # apply
//   node scripts/lemonsqueezy-configure-webhook.mjs --list     # list only
//   node scripts/lemonsqueezy-configure-webhook.mjs --dry-run  # show plan
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://api.lemonsqueezy.com/v1';
const WEBHOOK_URL = process.env.WEBHOOK_URL_OVERRIDE || 'https://policestationrepuk.org/api/lemon-squeezy/webhook';
const EVENTS = [
  'order_created',
  'subscription_created',
  'subscription_payment_success',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_expired',
  'subscription_payment_failed',
];

const DRY = process.argv.includes('--dry-run');
const LIST_ONLY = process.argv.includes('--list');

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

const apiKey = readVar('LEMON_SQUEEZY_API_KEY') || readVar('LEMONSQUEEZY_API_KEY');
const storeId = readVar('LEMON_SQUEEZY_STORE_ID') || readVar('LEMONSQUEEZY_STORE_ID');
const webhookSecret = readVar('LEMON_SQUEEZY_WEBHOOK_SECRET') || readVar('LEMONSQUEEZY_WEBHOOK_SECRET');

if (!apiKey) {
  console.error('Missing LEMON_SQUEEZY_API_KEY (or LEMONSQUEEZY_API_KEY)');
  process.exit(2);
}
if (!storeId) {
  console.error('Missing LEMON_SQUEEZY_STORE_ID (or LEMONSQUEEZY_STORE_ID)');
  process.exit(2);
}
if (!webhookSecret) {
  console.error('Missing LEMON_SQUEEZY_WEBHOOK_SECRET (or LEMONSQUEEZY_WEBHOOK_SECRET)');
  process.exit(2);
}

async function ls(method, urlPath, body) {
  const res = await fetch(`${API}${urlPath}`, {
    method,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${urlPath} -> ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function eventsEqual(a = [], b = []) {
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.length === bb.length && aa.every((v, i) => v === bb[i]);
}

async function main() {
  console.log(`store_id: ${storeId}`);
  console.log(`webhook_url target: ${WEBHOOK_URL}`);
  console.log(`events: ${EVENTS.join(', ')}\n`);

  const list = await ls('GET', `/webhooks?filter[store_id]=${storeId}&page[size]=100`);
  const hooks = list.data || [];
  console.log(`existing webhooks for store: ${hooks.length}`);
  for (const h of hooks) {
    console.log(`  #${h.id}  url=${h.attributes.url}  events=${(h.attributes.events || []).join(',')}`);
  }
  if (LIST_ONLY) return;

  const ours = hooks.find((h) => h.attributes?.url === WEBHOOK_URL);
  const desiredAttrs = {
    url: WEBHOOK_URL,
    events: EVENTS,
    secret: webhookSecret,
  };

  if (!ours) {
    console.log(`\n=> creating new webhook for ${WEBHOOK_URL}`);
    if (DRY) return;
    const created = await ls('POST', '/webhooks', {
      data: {
        type: 'webhooks',
        attributes: desiredAttrs,
        relationships: {
          store: { data: { type: 'stores', id: String(storeId) } },
        },
      },
    });
    console.log(`created webhook #${created.data.id}`);
  } else {
    const sameUrl = ours.attributes.url === WEBHOOK_URL;
    const sameEvents = eventsEqual(ours.attributes.events || [], EVENTS);
    if (sameUrl && sameEvents) {
      console.log(`\n=> webhook #${ours.id} already correct (url + events). Patching secret to ensure parity.`);
    } else {
      console.log(`\n=> updating webhook #${ours.id} url/events/secret`);
    }
    if (DRY) return;
    await ls('PATCH', `/webhooks/${ours.id}`, {
      data: {
        type: 'webhooks',
        id: String(ours.id),
        attributes: desiredAttrs,
      },
    });
    console.log(`updated webhook #${ours.id}`);
  }

  // Print final state
  const after = await ls('GET', `/webhooks?filter[store_id]=${storeId}&page[size]=100`);
  console.log('\nfinal webhooks:');
  for (const h of after.data || []) {
    console.log(`  #${h.id}  url=${h.attributes.url}  events=${(h.attributes.events || []).join(',')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
