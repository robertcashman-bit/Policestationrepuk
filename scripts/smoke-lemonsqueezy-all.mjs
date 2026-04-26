#!/usr/bin/env node
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
  if (!apiKey || !storeId) {
    console.error('[smoke-all] missing API key or store id');
    process.exit(2);
  }

  const tiers = [
    ['monthly', 'LEMONSQUEEZY_VARIANT_MONTHLY'],
    ['3month', 'LEMONSQUEEZY_VARIANT_3MONTH'],
    ['6month', 'LEMONSQUEEZY_VARIANT_6MONTH'],
    ['yearly', 'LEMONSQUEEZY_VARIANT_YEARLY'],
  ];

  let failures = 0;
  for (const [tier, envName] of tiers) {
    const variantId = trim(envName);
    if (!variantId) {
      console.error(`[smoke-all] ${tier}: ${envName} not set`);
      failures++;
      continue;
    }
    const variantRes = await fetch(`https://api.lemonsqueezy.com/v1/variants/${variantId}`, {
      headers: { Accept: 'application/vnd.api+json', Authorization: `Bearer ${apiKey}` },
    });
    if (!variantRes.ok) {
      console.error(`[smoke-all] ${tier}: variant ${variantId} -> ${variantRes.status}`);
      failures++;
      continue;
    }
    const variant = await variantRes.json();
    const variantName = variant.data?.attributes?.name;

    const coRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: 'smoketest@policestationrepuk.org',
              custom: { tier, source: 'smoke-all' },
            },
            checkout_options: { embed: false },
            product_options: {
              redirect_url: 'https://policestationrepuk.org/Account?featured=success',
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: storeId } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      }),
    });

    if (!coRes.ok) {
      console.error(`[smoke-all] ${tier}: checkout failed -> ${coRes.status}`);
      console.error(await coRes.text());
      failures++;
      continue;
    }
    const co = await coRes.json();
    console.log(
      `[smoke-all] ${tier.padEnd(7)} variant ${variantId} (${variantName}) -> ${co.data?.attributes?.url}`,
    );
  }

  if (failures > 0) {
    console.error(`[smoke-all] ${failures} tier(s) failed`);
    process.exit(1);
  }
  console.log('[smoke-all] PASS — all tiers create real Lemon Squeezy checkout URLs.');
}

main().catch((err) => {
  console.error('[smoke-all] crashed:', err);
  process.exit(1);
});
