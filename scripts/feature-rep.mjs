#!/usr/bin/env node
/**
 * Admin tool: manually set / unset / inspect a representative's "Featured" status.
 *
 * Usage:
 *   node scripts/feature-rep.mjs <email>                        # show status
 *   node scripts/feature-rep.mjs <email> --activate              # set featured
 *   node scripts/feature-rep.mjs <email> --deactivate            # remove featured
 *   node scripts/feature-rep.mjs <email> --set-counties Kent,Sussex
 *
 * Requires Upstash Redis env vars in .env.local (or in your shell):
 *   UPSTASH_REDIS_REST_URL  (or KV_REST_API_URL)
 *   UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_TOKEN)
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Redis } from '@upstash/redis';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

function loadDotEnv() {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    const p = join(ROOT, file);
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, 'utf8');
    for (const rawLine of txt.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = val;
    }
  }
}

loadDotEnv();

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  console.error('ERROR: Upstash Redis env vars not set.');
  console.error('Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_* equivalents) in .env.local');
  process.exit(1);
}

const args = process.argv.slice(2);
const email = (args[0] || '').trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: node scripts/feature-rep.mjs <email> [--activate|--deactivate|--set-counties Kent,Sussex]');
  process.exit(1);
}

const flags = new Set(args.slice(1).filter((a) => a.startsWith('--')));
const setCountiesIdx = args.indexOf('--set-counties');
const newCounties = setCountiesIdx >= 0 ? (args[setCountiesIdx + 1] || '') : '';

const redis = new Redis({ url, token });

const featuredKey = `featured:${email}`;
const profileKey = `profile:${email}`;
const newrepKey = `newrep:${email}`;

async function show() {
  const [featured, profile, newrep] = await Promise.all([
    redis.get(featuredKey),
    redis.get(profileKey),
    redis.get(newrepKey),
  ]);
  console.log(`\n=== ${email} ===`);
  console.log(`featured:${email}   ->`, featured ?? '(not set)');
  console.log(`profile:${email}    ->`, profile ?? '(not set)');
  console.log(`newrep:${email}     ->`, newrep ?? '(not set)');
}

async function activate() {
  const meta = {
    email,
    activatedAt: new Date().toISOString(),
    emailSentToRep: false,
    emailSentToOwner: false,
  };
  await redis.set(featuredKey, meta);
  console.log(`Featured set for ${email}:`, meta);
}

async function deactivate() {
  const removed = await redis.del(featuredKey);
  console.log(`Removed featured for ${email}. Keys deleted:`, removed);
}

async function setCounties() {
  const list = newCounties
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length) {
    console.error('--set-counties requires a comma-separated list, e.g. --set-counties "Kent, Sussex"');
    process.exit(1);
  }
  const existing = (await redis.get(profileKey)) || {};
  const merged = {
    ...existing,
    counties: list,
    updated_at: new Date().toISOString(),
    email,
  };
  await redis.set(profileKey, merged);
  console.log(`Counties set for ${email}:`, list);
}

(async () => {
  try {
    if (flags.has('--activate')) await activate();
    else if (flags.has('--deactivate')) await deactivate();
    if (setCountiesIdx >= 0) await setCounties();
    await show();
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
})();
