#!/usr/bin/env node
/**
 * Idempotent: ensure policestationagent.com exists in Resend, upsert DNS on
 * Cloudflare when zone is available, verify, and set Vercel from-address env.
 *
 *   node scripts/resend-ensure-psa-domain.mjs
 *   node scripts/resend-ensure-psa-domain.mjs --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';

const DOMAIN = 'policestationagent.com';
const PSA_FROM = 'Police Station Agent <noreply@policestationagent.com>';
const DRY = process.argv.includes('--dry-run');

function readEnvLocal() {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
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

const apiKey = readVar('RESEND_API_KEY');
if (!apiKey) {
  console.error('Missing RESEND_API_KEY');
  process.exit(1);
}

const resend = new Resend(apiKey);
const cfToken = readVar('CLOUDFLARE_API_TOKEN') || readVar('CF_API_TOKEN');
const vercelToken = readVar('VERCEL_TOKEN');
const vercelProjectId = readVar('VERCEL_PROJECT_ID') || 'prj_lZ0zL8uq5cBDFosKovyF0n8FmlCn';
const vercelTeamId = readVar('VERCEL_ORG_ID') || 'team_wbvkpoLfvbg9qFwg5LqJLAjN';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function listDomains() {
  const { data, error } = await resend.domains.list();
  if (error) throw new Error(`domains.list: ${error.message ?? JSON.stringify(error)}`);
  const rows = Array.isArray(data) ? data : data?.data ?? [];
  return rows;
}

async function ensureDomain() {
  const domains = await listDomains();
  let existing = domains.find((d) => d.name?.toLowerCase() === DOMAIN);
  if (existing) {
    console.log(`[psa-domain] Resend domain exists: ${existing.id} status=${existing.status}`);
    return existing;
  }
  if (DRY) {
    console.log(`[psa-domain] dry-run — would create ${DOMAIN}`);
    return null;
  }
  const { data, error } = await resend.domains.create({ name: DOMAIN });
  if (error) throw new Error(`domains.create: ${error.message ?? JSON.stringify(error)}`);
  console.log(`[psa-domain] created ${data.id}`);
  return data;
}

async function getDomain(id) {
  const { data, error } = await resend.domains.get(id);
  if (error) throw new Error(`domains.get: ${error.message ?? JSON.stringify(error)}`);
  return data;
}

async function cfFetch(pathname, init = {}) {
  if (!cfToken) return null;
  const r = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const json = await r.json();
  if (!json.success) {
    console.warn('[psa-domain] Cloudflare error', json.errors);
    return null;
  }
  return json.result;
}

async function upsertCloudflareDns(records) {
  if (!cfToken) {
    console.log('[psa-domain] No CLOUDFLARE_API_TOKEN — print DNS records for manual setup');
    return false;
  }
  const zones = await cfFetch(`/zones?name=${encodeURIComponent(DOMAIN)}`);
  const zone = Array.isArray(zones) ? zones[0] : null;
  if (!zone?.id) {
    console.log(`[psa-domain] Cloudflare zone ${DOMAIN} not found — print DNS for manual setup`);
    return false;
  }

  for (const rec of records ?? []) {
    const type = String(rec.record ?? rec.type ?? '').toUpperCase();
    const name = rec.name || DOMAIN;
    const content = rec.value ?? rec.content;
    if (!type || !content) continue;
    const priority = rec.priority ?? (type === 'MX' ? 10 : undefined);
    const list = await cfFetch(
      `/zones/${zone.id}/dns_records?type=${type}&name=${encodeURIComponent(name)}`,
    );
    const existing = Array.isArray(list) ? list.find((r) => r.content === content) : null;
    if (existing) {
      console.log(`[psa-domain] DNS OK ${type} ${name}`);
      continue;
    }
    if (DRY) {
      console.log(`[psa-domain] dry-run — would create ${type} ${name} → ${content}`);
      continue;
    }
    const body = {
      type,
      name,
      content,
      ttl: 3600,
      proxied: false,
      ...(priority != null ? { priority } : {}),
    };
    const created = await cfFetch(`/zones/${zone.id}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (created) console.log(`[psa-domain] DNS created ${type} ${name}`);
  }
  return true;
}

async function verifyAndPoll(domainId) {
  if (DRY) return 'dry-run';
  await resend.domains.verify(domainId);
  for (let i = 0; i < 12; i++) {
    const d = await getDomain(domainId);
    console.log(`[psa-domain] verify poll ${i + 1}: status=${d.status}`);
    if (d.status === 'verified') return 'verified';
    await sleep(10_000);
  }
  return 'pending';
}

async function setVercelEnv() {
  if (!vercelToken) {
    console.log('[psa-domain] No VERCEL_TOKEN — set FIRM_OUTREACH_PSA_FROM_EMAIL manually');
    return;
  }
  if (DRY) {
    console.log('[psa-domain] dry-run — would set Vercel FIRM_OUTREACH_PSA_FROM_EMAIL');
    return;
  }
  const listUrl = new URL(
    `https://api.vercel.com/v9/projects/${vercelProjectId}/env`,
  );
  listUrl.searchParams.set('teamId', vercelTeamId);
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${vercelToken}` },
  });
  const listJson = await listRes.json();
  const envs = listJson.envs ?? [];
  const existing = envs.find((e) => e.key === 'FIRM_OUTREACH_PSA_FROM_EMAIL');
  if (existing) {
    const patchUrl = new URL(
      `https://api.vercel.com/v9/projects/${vercelProjectId}/env/${existing.id}`,
    );
    patchUrl.searchParams.set('teamId', vercelTeamId);
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: PSA_FROM, type: 'plain' }),
    });
    console.log(`[psa-domain] Vercel env PATCH → ${patchRes.status}`);
    return;
  }
  const createUrl = new URL(
    `https://api.vercel.com/v10/projects/${vercelProjectId}/env`,
  );
  createUrl.searchParams.set('teamId', vercelTeamId);
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: 'FIRM_OUTREACH_PSA_FROM_EMAIL',
      value: PSA_FROM,
      type: 'plain',
      target: ['production', 'preview', 'development'],
    }),
  });
  console.log(`[psa-domain] Vercel env POST → ${createRes.status}`);
}

async function main() {
  const created = await ensureDomain();
  if (!created && DRY) return;

  const detail = await getDomain(created.id);
  const records = detail.records ?? detail.dns ?? [];
  console.log('[psa-domain] DNS records required:');
  for (const r of records) {
    console.log(
      `  ${r.record ?? r.type} ${r.name} → ${r.value ?? r.content}${r.priority != null ? ` (prio ${r.priority})` : ''}`,
    );
  }

  await upsertCloudflareDns(records);

  let status = detail.status;
  if (status !== 'verified') {
    status = await verifyAndPoll(created.id);
  }
  console.log(`[psa-domain] final status=${status}`);

  if (status === 'verified') {
    await setVercelEnv();
    console.log(`[psa-domain] Preferred from: ${PSA_FROM}`);
  } else {
    console.log(
      '[psa-domain] Not verified yet — send path will keep RepUK from-address fallback until DNS propagates.',
    );
    console.log('[psa-domain] Re-run this script after DNS is live.');
  }
}

main().catch((err) => {
  console.error('[psa-domain] failed:', err);
  process.exit(1);
});
