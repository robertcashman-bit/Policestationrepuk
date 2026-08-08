#!/usr/bin/env node
/**
 * Ensure OUTREACH_ADMIN_EMAIL exists on Vercel production.
 * Prefers existing OUTREACH_ADMIN_EMAIL, else FIRM_OUTREACH_DIGEST_EMAIL from status/env.
 *
 * Env: VERCEL_TOKEN, VERCEL_PROJECT_ID, optional VERCEL_ORG_ID,
 *      optional OUTREACH_ADMIN_EMAIL / FIRM_OUTREACH_DIGEST_EMAIL overrides.
 */
const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();
const teamId = process.env.VERCEL_ORG_ID?.trim();

if (!token || !projectId) {
  console.error('VERCEL_TOKEN and VERCEL_PROJECT_ID required');
  process.exit(1);
}

async function vercel(pathname, opts = {}) {
  const url = new URL(`https://api.vercel.com${pathname}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Vercel ${opts.method || 'GET'} ${pathname} → ${res.status}: ${text.slice(0, 400)}`);
  }
  return data;
}

const desired =
  process.env.OUTREACH_ADMIN_EMAIL?.trim() ||
  process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() ||
  '';

if (!desired) {
  console.log(JSON.stringify({ ok: false, reason: 'no_admin_candidate' }));
  process.exit(2);
}

const envJson = await vercel(`/v9/projects/${projectId}/env`, {
  query: { decrypt: 'true' },
});
const envs = envJson?.envs || [];
const matches = envs.filter(
  (e) =>
    e.key === 'OUTREACH_ADMIN_EMAIL' &&
    (!e.target || e.target.includes('production') || e.target.length === 0),
);
const current = matches.map((e) => (e.value || '').trim()).find((v) => v.length > 0);

if (current === desired) {
  console.log(JSON.stringify({ ok: true, action: 'unchanged', configured: true }));
  process.exit(0);
}

for (const entry of matches) {
  if (!entry.id) continue;
  await vercel(`/v9/projects/${projectId}/env/${entry.id}`, { method: 'DELETE' });
}

await vercel(`/v10/projects/${projectId}/env`, {
  method: 'POST',
  body: {
    key: 'OUTREACH_ADMIN_EMAIL',
    value: desired,
    type: 'encrypted',
    target: ['production'],
  },
});

console.log(
  JSON.stringify({
    ok: true,
    action: current ? 'replaced' : 'created',
    configured: true,
    // never print the address in full in CI summaries if unwanted — keep domain only
    domain: desired.includes('@') ? desired.split('@')[1] : 'set',
  }),
);
