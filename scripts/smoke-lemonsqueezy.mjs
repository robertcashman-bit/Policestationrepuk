#!/usr/bin/env node
// Smoke test against the real Lemon Squeezy API. Requires:
//   LEMONSQUEEZY_API_KEY
//   LEMONSQUEEZY_STORE_ID
//   LEMONSQUEEZY_VARIANT_MONTHLY (or any variant id)
// Reads .env.local automatically. Exits non-zero on failure.

import fs from 'node:fs';
import path from 'node:path';

function loadDotenvLocal() {
  const file = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  const txt = fs.readFileSync(file, 'utf8');
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    let [, key, value] = m;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    if (!process.env[key]) process.env[key] = value;
  }
}

function trim(name) {
  const v = process.env[name];
  return v ? v.trim() : '';
}

async function main() {
  loadDotenvLocal();

  const apiKey = trim('LEMONSQUEEZY_API_KEY');
  const storeId = trim('LEMONSQUEEZY_STORE_ID');
  const variantId = trim('LEMONSQUEEZY_VARIANT_MONTHLY');

  if (!apiKey || !storeId || !variantId) {
    console.error('[smoke] Missing env vars (need API_KEY, STORE_ID, VARIANT_MONTHLY).');
    process.exit(2);
  }

  console.log('[smoke] /v1/users/me — verifying API key…');
  const meRes = await fetch('https://api.lemonsqueezy.com/v1/users/me', {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!meRes.ok) {
    console.error('[smoke] users/me failed:', meRes.status, await meRes.text());
    process.exit(3);
  }
  const me = await meRes.json();
  console.log('[smoke]   ok — user:', me.data?.attributes?.email || me.data?.id);

  console.log('[smoke] /v1/stores/' + storeId + ' — verifying store id…');
  const storeRes = await fetch(`https://api.lemonsqueezy.com/v1/stores/${storeId}`, {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!storeRes.ok) {
    console.error('[smoke] store failed:', storeRes.status, await storeRes.text());
    process.exit(4);
  }
  const store = await storeRes.json();
  console.log('[smoke]   ok — store:', store.data?.attributes?.name);

  console.log('[smoke] /v1/variants/' + variantId + ' — verifying variant id…');
  const varRes = await fetch(`https://api.lemonsqueezy.com/v1/variants/${variantId}`, {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!varRes.ok) {
    console.error('[smoke] variant failed:', varRes.status, await varRes.text());
    process.exit(5);
  }
  const variant = await varRes.json();
  console.log('[smoke]   ok — variant:', variant.data?.attributes?.name);

  console.log('[smoke] POST /v1/checkouts — creating a checkout URL…');
  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: 'smoketest@policestationrepuk.org',
          name: 'Smoke Test',
          custom: { tier: 'monthly', source: 'smoke-script' },
        },
        checkout_options: { embed: false, media: false, button_color: '#1e3a5f' },
        product_options: { redirect_url: 'https://policestationrepuk.org/Account?featured=success' },
      },
      relationships: {
        store: { data: { type: 'stores', id: storeId } },
        variant: { data: { type: 'variants', id: variantId } },
      },
    },
  };

  const coRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await coRes.text();
  if (!coRes.ok) {
    console.error('[smoke] checkout failed:', coRes.status);
    console.error(text);
    process.exit(6);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error('[smoke] checkout response was not JSON:', err);
    console.error(text);
    process.exit(7);
  }

  const url = json.data?.attributes?.url;
  const id = json.data?.id;
  if (!url) {
    console.error('[smoke] no checkout URL in response');
    console.error(text);
    process.exit(8);
  }

  console.log('[smoke]   ok — checkout id:', id);
  console.log('[smoke]   ok — checkout url:', url);
  console.log('[smoke] PASS — Lemon Squeezy is correctly wired up.');
}

main().catch((err) => {
  console.error('[smoke] crashed:', err);
  process.exit(1);
});
