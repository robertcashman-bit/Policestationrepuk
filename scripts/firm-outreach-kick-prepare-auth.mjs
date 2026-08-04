#!/usr/bin/env node
/**
 * Prepare auth for firm-outreach production kick (GitHub Actions).
 *
 * 1. Load CRON_SECRET / FIRM_OUTREACH_BOOTSTRAP_SECRET via Vercel env API (decrypt=true)
 * 2. If both empty, provision FIRM_OUTREACH_BOOTSTRAP_SECRET on production
 * 3. If FIRM_OUTREACH_REQUIRE_APPROVAL is true, set it to false
 * 4. Redeploy production when env changed, wait until READY
 * 5. Write non-empty secrets to GITHUB_ENV (lengths only in logs)
 *
 * Env: VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID (optional team)
 */
import { appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();
const teamId = process.env.VERCEL_ORG_ID?.trim();
const vercelEnabled = Boolean(token && projectId);

function apiUrl(path, query = {}) {
  const u = new URL(`https://api.vercel.com${path}`);
  if (teamId) u.searchParams.set('teamId', teamId);
  for (const [k, v] of Object.entries(query)) {
    if (v != null) u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function vercelJson(path, opts = {}) {
  if (!token) {
    throw new Error('VERCEL_TOKEN is required for Vercel API requests');
  }
  const res = await fetch(apiUrl(path, opts.query), {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = typeof data?.error?.message === 'string' ? data.error.message : text.slice(0, 500);
    throw new Error(`Vercel API ${opts.method || 'GET'} ${path} → HTTP ${res.status}: ${msg}`);
  }
  return data;
}

/** Vercel sometimes returns envelope ciphertext even with decrypt=true. */
function isUsableSecretValue(value) {
  const v = String(value || '').trim();
  if (!v) return false;
  // Vercel encrypted envelope: {"v":"v2",...} base64 → eyJ…
  if (v.startsWith('eyJ')) return false;
  if (v === '[SENSITIVE]' || v === '*****') return false;
  return true;
}

function pickEnvValue(envs, key) {
  const matches = (envs || []).filter(
    (e) => e.key === key && (!e.target || e.target.includes('production') || e.target.length === 0),
  );
  // Prefer production-targeted entries with a non-empty *usable* value.
  const ranked = matches.sort((a, b) => {
    const aProd = a.target?.includes('production') ? 0 : 1;
    const bProd = b.target?.includes('production') ? 0 : 1;
    if (aProd !== bProd) return aProd - bProd;
    const aUsable = isUsableSecretValue(a.value) ? 0 : 1;
    const bUsable = isUsableSecretValue(b.value) ? 0 : 1;
    if (aUsable !== bUsable) return aUsable - bUsable;
    return String(b.value || '').length - String(a.value || '').length;
  });
  const hit = ranked[0];
  const raw = hit?.value?.trim?.() ? hit.value.trim() : '';
  const value = isUsableSecretValue(raw) ? raw : '';
  return { value, id: hit?.id || null, entries: matches, raw };
}

function writeGithubEnv(pairs) {
  const githubEnv = process.env.GITHUB_ENV;
  if (!githubEnv) return;
  let block = '';
  for (const [key, value] of Object.entries(pairs)) {
    if (!value) continue;
    // Delimiter form avoids multiline/special-char issues.
    const delim = `EOF_${key}_${randomBytes(4).toString('hex')}`;
    block += `${key}<<${delim}\n${value}\n${delim}\n`;
  }
  if (block) appendFileSync(githubEnv, block);
}

async function upsertProductionEnv(key, value, existingIds) {
  for (const id of existingIds) {
    console.log(`Removing existing ${key} env id ${id}`);
    await vercelJson(`/v9/projects/${projectId}/env/${id}`, { method: 'DELETE' });
  }
  console.log(`Creating production ${key} (${value.length} chars)`);
  await vercelJson(`/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: {
      key,
      value,
      type: 'encrypted',
      target: ['production'],
    },
  });
}

async function getProjectName() {
  const project = await vercelJson(`/v9/projects/${projectId}`);
  return project.name || projectId;
}

async function redeployLatestProduction() {
  const wantSha = process.env.FIRM_OUTREACH_KICK_COMMIT_SHA?.trim() || '';
  const list = await vercelJson('/v6/deployments', {
    query: { projectId, target: 'production', limit: 15 },
  });
  const deployments = list.deployments || [];
  const bySha = wantSha
    ? deployments.find(
        (d) =>
          d.readyState === 'READY' &&
          (d.meta?.githubCommitSha === wantSha ||
            String(d.meta?.githubCommitSha || '').startsWith(wantSha.slice(0, 7))),
      )
    : null;
  const ready =
    bySha ||
    deployments.find((d) => d.readyState === 'READY') ||
    deployments[0];
  if (!ready?.uid && !ready?.id) {
    throw new Error('No production deployment found to redeploy');
  }
  const id = ready.uid || ready.id;
  const name = await getProjectName();
  const shaLabel = ready.meta?.githubCommitSha?.slice(0, 7) || 'unknown';
  console.log(
    `Redeploying production deployment ${id} sha=${shaLabel} (project=${name}${wantSha ? `; prefer=${wantSha.slice(0, 7)}` : ''})`,
  );
  // Correct redeploy path: POST /v13/deployments with deploymentId (+ forceNew).
  const redeploy = await vercelJson('/v13/deployments', {
    method: 'POST',
    query: { forceNew: '1' },
    body: {
      name,
      deploymentId: id,
      target: 'production',
      project: projectId,
    },
  });
  const newId = redeploy.id || redeploy.uid;
  if (!newId) {
    throw new Error('Redeploy response missing deployment id');
  }
  const deadline = Date.now() + 12 * 60_000;
  while (Date.now() < deadline) {
    const dep = await vercelJson(`/v13/deployments/${newId}`);
    const state = dep.readyState || dep.status;
    console.log(`Redeploy state=${state}`);
    if (state === 'READY') {
      // Confirm the production alias still reports the intended commit when known.
      if (wantSha) {
        try {
          const health = await fetch('https://policestationrepuk.org/api/health');
          const json = await health.json();
          const ver = String(json?.version || '');
          if (ver && ver !== wantSha.slice(0, 7)) {
            console.warn(
              `Redeploy READY but /api/health version=${ver} want=${wantSha.slice(0, 7)} — alias may lag`,
            );
          } else {
            console.log(`Redeploy READY; /api/health version=${ver || 'n/a'}`);
          }
        } catch (err) {
          console.warn(
            'Could not verify /api/health after redeploy:',
            err instanceof Error ? err.message : err,
          );
        }
      }
      return;
    }
    if (state === 'ERROR' || state === 'CANCELED') {
      throw new Error(`Redeploy failed: ${state}`);
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
  throw new Error('Redeploy wait timed out');
}

async function productionAcceptsBootstrap(secret) {
  const base = (process.env.FIRM_OUTREACH_KICK_BASE_URL || 'https://policestationrepuk.org').replace(
    /\/$/,
    '',
  );
  try {
    const res = await fetch(`${base}/api/cron/firm-outreach-status`, {
      headers: { 'x-firm-outreach-bootstrap-secret': secret },
    });
    // Require a real 2xx — 5xx must not be treated as auth success.
    return res.ok;
  } catch {
    return false;
  }
}

const RESEND_WEBHOOK_URL =
  process.env.RESEND_WEBHOOK_URL_OVERRIDE || 'https://policestationrepuk.org/api/webhooks/resend';

const RESEND_WEBHOOK_EVENTS = [
  'email.sent',
  'email.delivered',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
];

function resendWebhookEventsMatch(existing) {
  if (!existing?.length) return false;
  const have = new Set(existing);
  return RESEND_WEBHOOK_EVENTS.every((e) => have.has(e));
}

/**
 * Ensure production webhook is enabled, events are complete, and
 * RESEND_WEBHOOK_SECRET matches Resend. Returns { needsRedeploy, signingSecret }.
 */
async function ensureResendWebhookHealthy(apiKey, currentSecret, existingIds) {
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  const listRes = await fetch('https://api.resend.com/webhooks', { headers });
  const listText = await listRes.text();
  let listJson = null;
  try {
    listJson = listText ? JSON.parse(listText) : null;
  } catch {
    listJson = null;
  }
  if (!listRes.ok) {
    throw new Error(`Resend webhooks list HTTP ${listRes.status}: ${listText.slice(0, 300)}`);
  }
  const hooks = listJson?.data ?? listJson?.webhooks ?? [];
  let ours = hooks.find((h) => h.endpoint === RESEND_WEBHOOK_URL);
  let needsRedeploy = false;
  let reenabled = false;

  if (!ours?.id) {
    console.log(`[kick prepare] Creating Resend webhook at ${RESEND_WEBHOOK_URL}`);
    const createRes = await fetch('https://api.resend.com/webhooks', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        endpoint: RESEND_WEBHOOK_URL,
        events: RESEND_WEBHOOK_EVENTS,
      }),
    });
    const createText = await createRes.text();
    let created = null;
    try {
      created = createText ? JSON.parse(createText) : null;
    } catch {
      created = null;
    }
    if (!createRes.ok) {
      throw new Error(`Resend webhook create HTTP ${createRes.status}: ${createText.slice(0, 300)}`);
    }
    ours = created?.data ?? created;
    reenabled = true;
  } else if (ours.status !== 'enabled' || !resendWebhookEventsMatch(ours.events)) {
    console.log(
      `[kick prepare] Re-enabling Resend webhook ${ours.id} (status=${ours.status || 'unknown'})`,
    );
    const patchRes = await fetch(`https://api.resend.com/webhooks/${ours.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        endpoint: RESEND_WEBHOOK_URL,
        events: RESEND_WEBHOOK_EVENTS,
        status: 'enabled',
      }),
    });
    const patchText = await patchRes.text();
    if (!patchRes.ok) {
      throw new Error(`Resend webhook update HTTP ${patchRes.status}: ${patchText.slice(0, 300)}`);
    }
    reenabled = true;
  } else {
    console.log(`[kick prepare] Resend webhook enabled at ${RESEND_WEBHOOK_URL} (${ours.id})`);
  }

  if (!ours?.id) {
    return { needsRedeploy: false, signingSecret: '' };
  }

  const getRes = await fetch(`https://api.resend.com/webhooks/${ours.id}`, { headers });
  const getText = await getRes.text();
  let detail = null;
  try {
    detail = getText ? JSON.parse(getText) : null;
  } catch {
    detail = null;
  }
  if (!getRes.ok) {
    throw new Error(`Resend webhook get HTTP ${getRes.status}: ${getText.slice(0, 300)}`);
  }
  const signingSecret = (
    detail?.data?.signing_secret ||
    detail?.signing_secret ||
    ours.signing_secret ||
    ''
  ).trim();
  if (!signingSecret) {
    console.log('[kick prepare] Resend webhook has no signing_secret in API response');
    return { needsRedeploy: reenabled, signingSecret: '' };
  }

  if (currentSecret && currentSecret === signingSecret) {
    console.log(
      `[kick prepare] RESEND_WEBHOOK_SECRET matches Resend (${ours.id}, len=${signingSecret.length})`,
    );
    return { needsRedeploy: reenabled, signingSecret };
  }

  console.log(
    `[kick prepare] Syncing RESEND_WEBHOOK_SECRET from Resend ${ours.id} (was_len=${currentSecret.length || 0} → ${signingSecret.length})`,
  );
  await upsertProductionEnv('RESEND_WEBHOOK_SECRET', signingSecret, existingIds);
  needsRedeploy = true;
  return { needsRedeploy, signingSecret };
}

async function main() {
  // Prefer non-empty *usable* values already in the process env (GH secrets / env pull).
  let cron = isUsableSecretValue(process.env.CRON_SECRET) ? process.env.CRON_SECRET.trim() : '';
  let bootstrap = isUsableSecretValue(process.env.FIRM_OUTREACH_BOOTSTRAP_SECRET)
    ? process.env.FIRM_OUTREACH_BOOTSTRAP_SECRET.trim()
    : '';
  let needsRedeploy = false;
  let webhookSigningSecretOut = isUsableSecretValue(process.env.RESEND_WEBHOOK_SECRET)
    ? process.env.RESEND_WEBHOOK_SECRET.trim()
    : '';

  if (vercelEnabled) {
    console.log('Fetching Vercel production env (decrypt=true)…');
    const envJson = await vercelJson(`/v9/projects/${projectId}/env`, {
      query: { decrypt: 'true' },
    });
    const envs = envJson.envs || [];

    const cronPick = pickEnvValue(envs, 'CRON_SECRET');
    const bootstrapPick = pickEnvValue(envs, 'FIRM_OUTREACH_BOOTSTRAP_SECRET');
    const approvalPick = pickEnvValue(envs, 'FIRM_OUTREACH_REQUIRE_APPROVAL');
    const dryRunPick = pickEnvValue(envs, 'FIRM_OUTREACH_DRY_RUN');
    const sendEnabledPick = pickEnvValue(envs, 'FIRM_OUTREACH_SEND_ENABLED');
    const dailyCapPick = pickEnvValue(envs, 'FIRM_OUTREACH_DAILY_CAP');
    const resendLimitPick = pickEnvValue(envs, 'FIRM_OUTREACH_RESEND_DAILY_LIMIT');
    const resendHeadroomPick = pickEnvValue(envs, 'FIRM_OUTREACH_RESEND_HEADROOM');
    const cooldownPick = pickEnvValue(envs, 'FIRM_OUTREACH_FIRM_COOLDOWN_DAYS');

    if (!cron && cronPick.value) cron = cronPick.value;
    if (!bootstrap && bootstrapPick.value) bootstrap = bootstrapPick.value;

    console.log(
      `Decrypt load: cron_len=${cron.length} bootstrap_len=${bootstrap.length} cron_entries=${cronPick.entries.length} bootstrap_entries=${bootstrapPick.entries.length} require_approval=${JSON.stringify(approvalPick.value || '')} daily_cap=${JSON.stringify(dailyCapPick.value || '')} firm_cooldown=${JSON.stringify(cooldownPick.value || '')}`,
    );

    // CRITICAL: do not casually rotate when decrypt returns an opaque envelope
    // (eyJ…). Runtime still has the real value; concurrent rotates cause 401s.
    if (!cron && !bootstrap) {
      const envPresent = cronPick.entries.length > 0 || bootstrapPick.entries.length > 0;
      const allowRotate = process.env.FIRM_OUTREACH_ALLOW_BOOTSTRAP_ROTATE === '1';
      if (envPresent && !allowRotate) {
        console.error(
          'CRON_SECRET / FIRM_OUTREACH_BOOTSTRAP_SECRET exist on Vercel but decrypt did not yield a usable value.',
        );
        console.error(
          'Set repository secrets CRON_SECRET and/or FIRM_OUTREACH_BOOTSTRAP_SECRET to the Production values, or re-run with FIRM_OUTREACH_ALLOW_BOOTSTRAP_ROTATE=1 (single-flight only).',
        );
        process.exit(1);
      }
      bootstrap = randomBytes(32).toString('hex');
      const ids = bootstrapPick.entries.map((e) => e.id).filter(Boolean);
      await upsertProductionEnv('FIRM_OUTREACH_BOOTSTRAP_SECRET', bootstrap, ids);
      needsRedeploy = true;
      console.log(
        envPresent
          ? 'Rotated FIRM_OUTREACH_BOOTSTRAP_SECRET (explicit ALLOW_BOOTSTRAP_ROTATE=1)'
          : 'Provisioned FIRM_OUTREACH_BOOTSTRAP_SECRET on production (was missing)',
      );
    }

    // Durable production policy mutations require an explicit ungate flag.
    // Status-only verify must never clear approval, zero cooldown, or raise caps.
    const allowUngate = process.env.FIRM_OUTREACH_PREPARE_UNGATE === '1';
    if (!allowUngate) {
      console.log(
        'Skipping durable send-policy mutations (set FIRM_OUTREACH_PREPARE_UNGATE=1 for live kicks only)',
      );
    } else {
      const approvalRaw = (approvalPick.value || '').toLowerCase();
      if (approvalRaw === 'true' || approvalRaw === '1' || approvalRaw === 'yes') {
        const ids = approvalPick.entries.map((e) => e.id).filter(Boolean);
        await upsertProductionEnv('FIRM_OUTREACH_REQUIRE_APPROVAL', 'false', ids);
        needsRedeploy = true;
        console.log('Ungated FIRM_OUTREACH_REQUIRE_APPROVAL → false');
      }

      const dryRunRaw = (dryRunPick.value || '').toLowerCase();
      if (dryRunRaw === 'true' || dryRunRaw === '1' || dryRunRaw === 'yes') {
        const ids = dryRunPick.entries.map((e) => e.id).filter(Boolean);
        await upsertProductionEnv('FIRM_OUTREACH_DRY_RUN', 'false', ids);
        needsRedeploy = true;
        console.log('Disabled FIRM_OUTREACH_DRY_RUN → false');
      }
      const sendEnabledRaw = (sendEnabledPick.value || '').toLowerCase();
      if (sendEnabledRaw === 'false' || sendEnabledRaw === '0' || sendEnabledRaw === 'no') {
        const ids = sendEnabledPick.entries.map((e) => e.id).filter(Boolean);
        await upsertProductionEnv('FIRM_OUTREACH_SEND_ENABLED', 'true', ids);
        needsRedeploy = true;
        console.log('Enabled FIRM_OUTREACH_SEND_ENABLED → true');
      }

      // Raise accidental low daily caps up to the Resend outreach budget (limit - headroom).
      const resendLimit = Number(resendLimitPick.value || 100) || 100;
      const resendHeadroom = Number(resendHeadroomPick.value || 10) || 10;
      const targetDailyCap = Math.max(1, resendLimit - resendHeadroom);
      const currentDailyCap = Number(dailyCapPick.value || 0) || 0;
      if (!dailyCapPick.value || currentDailyCap < targetDailyCap) {
        const ids = dailyCapPick.entries.map((e) => e.id).filter(Boolean);
        await upsertProductionEnv('FIRM_OUTREACH_DAILY_CAP', String(targetDailyCap), ids);
        needsRedeploy = true;
        console.log(
          `Raised FIRM_OUTREACH_DAILY_CAP ${currentDailyCap || '(unset)'} → ${targetDailyCap} (Resend budget)`,
        );
      }
    }

    // Never persist firm_cooldown=0 from prepare. Restore accidental zeros to 90.
    const currentCooldown = (cooldownPick.value || '').trim();
    if (currentCooldown === '0') {
      const ids = cooldownPick.entries.map((e) => e.id).filter(Boolean);
      await upsertProductionEnv('FIRM_OUTREACH_FIRM_COOLDOWN_DAYS', '90', ids);
      needsRedeploy = true;
      console.log('Restored FIRM_OUTREACH_FIRM_COOLDOWN_DAYS 0 → 90');
    }

    // Re-enable Resend webhook if auto-disabled; keep signing secret in sync.
    const resendKeyPick = pickEnvValue(envs, 'RESEND_API_KEY');
    const webhookSecretPick = pickEnvValue(envs, 'RESEND_WEBHOOK_SECRET');
    const resendApiKey =
      process.env.RESEND_API_KEY?.trim() || resendKeyPick.value || '';
    if (!webhookSigningSecretOut && webhookSecretPick.value) {
      webhookSigningSecretOut = webhookSecretPick.value;
    }
    if (resendApiKey) {
      try {
        const ensured = await ensureResendWebhookHealthy(
          resendApiKey,
          isUsableSecretValue(webhookSecretPick.value) ? webhookSecretPick.value : '',
          webhookSecretPick.entries.map((e) => e.id).filter(Boolean),
        );
        if (ensured.needsRedeploy) needsRedeploy = true;
        if (ensured.signingSecret?.startsWith('whsec_')) {
          webhookSigningSecretOut = ensured.signingSecret;
        }
      } catch (err) {
        console.warn(
          '[kick prepare] Resend webhook ensure failed:',
          err instanceof Error ? err.message : err,
        );
      }
    } else {
      console.log('[kick prepare] RESEND_API_KEY missing — skip webhook ensure');
    }
    if (webhookSigningSecretOut && !webhookSigningSecretOut.startsWith('whsec_')) {
      console.warn(
        '[kick prepare] Dropping non-whsec RESEND_WEBHOOK_SECRET (likely undecrypted envelope)',
      );
      webhookSigningSecretOut = '';
    }

    // Bootstrap may already exist in Vercel from a prior kick that failed before redeploy.
    if (!needsRedeploy && !cron && bootstrap) {
      const ok = await productionAcceptsBootstrap(bootstrap);
      if (!ok) {
        console.log('Production does not accept bootstrap yet — redeploying to pick up env');
        needsRedeploy = true;
      }
    }

    if (needsRedeploy) {
      await redeployLatestProduction();
    }

    // Prove the secret we will use actually authorises production before kick.
    if (bootstrap && !cron) {
      let accepted = false;
      for (let i = 1; i <= 12; i++) {
        accepted = await productionAcceptsBootstrap(bootstrap);
        console.log(`Bootstrap auth probe ${i}/12 → ${accepted ? 'ok' : 'reject'}`);
        if (accepted) break;
        await new Promise((r) => setTimeout(r, 10_000));
      }
      if (!accepted) {
        console.error(
          'Production still rejects FIRM_OUTREACH_BOOTSTRAP_SECRET after prepare/redeploy.',
        );
        console.error(
          'Fix: copy the Production bootstrap/cron secret into GitHub Actions secrets and re-run.',
        );
        process.exit(1);
      }
    }
  } else {
    console.log('VERCEL_TOKEN / VERCEL_PROJECT_ID not set — skipping Vercel decrypt / provision / ungate');
  }

  process.env.CRON_SECRET = cron;
  process.env.FIRM_OUTREACH_BOOTSTRAP_SECRET = bootstrap;
  if (webhookSigningSecretOut) {
    process.env.RESEND_WEBHOOK_SECRET = webhookSigningSecretOut;
  }

  // Mask so Actions logs do not print rotated/provisioned values.
  for (const value of [cron, bootstrap, webhookSigningSecretOut]) {
    if (value && process.env.GITHUB_ACTIONS === 'true') {
      console.log(`::add-mask::${value}`);
    }
  }

  writeGithubEnv({
    CRON_SECRET: cron,
    FIRM_OUTREACH_BOOTSTRAP_SECRET: bootstrap,
    RESEND_WEBHOOK_SECRET: webhookSigningSecretOut,
  });

  console.log(
    `Kick auth ready: cron=${cron ? 'yes' : 'no'} bootstrap=${bootstrap ? 'yes' : 'no'} webhook_secret=${webhookSigningSecretOut ? 'yes' : 'no'} redeployed=${needsRedeploy}`,
  );

  if (!cron && !bootstrap) {
    console.error('Still no cron/bootstrap auth after prepare');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
