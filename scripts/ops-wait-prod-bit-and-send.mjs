#!/usr/bin/env node
/**
 * Auto-test loop: wait until production health matches bit master tip and
 * firm-outreach-autoheal is present, then run inventory kick + bounded sends.
 *
 * Auth: CRON_SECRET Bearer and/or x-firm-outreach-bootstrap-secret from env /
 * /tmp/outreach-bootstrap.secret (ops only; never log secrets).
 *
 * Usage:
 *   node scripts/ops-wait-prod-bit-and-send.mjs
 *   node scripts/ops-wait-prod-bit-and-send.mjs --tip=1a82a77 --limit=45
 */
import { readFileSync, existsSync } from 'node:fs';

const BASE = process.env.OUTREACH_BASE_URL || 'https://policestationrepuk.org';
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const tipArg = process.argv.find((a) => a.startsWith('--tip='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) || 45 : 45;
const WANT_TIP = tipArg ? tipArg.split('=')[1] : process.env.WANT_TIP || '';
const MAX_WAIT_MS = Number(process.env.MAX_WAIT_MS || 45 * 60 * 1000);

function loadBootstrap() {
  const env = (process.env.FIRM_OUTREACH_BOOTSTRAP_SECRET || '').trim();
  if (env) return env;
  for (const p of ['/tmp/outreach-bootstrap.secret', '.outreach-bootstrap.secret']) {
    if (existsSync(p)) return readFileSync(p, 'utf8').trim();
  }
  return '';
}

function headers() {
  const cron = (process.env.CRON_SECRET || '').trim();
  const boot = loadBootstrap();
  if (cron) return { Authorization: `Bearer ${cron}`, 'x-cron-secret': cron };
  if (boot) return { 'x-firm-outreach-bootstrap-secret': boot };
  throw new Error('Missing CRON_SECRET / FIRM_OUTREACH_BOOTSTRAP_SECRET');
}

async function hit(path) {
  const r = await fetch(BASE + path, { headers: headers() });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: r.status, json };
}

async function health() {
  const r = await fetch(`${BASE}/api/health`);
  return r.json();
}

async function autohealCode() {
  const r = await fetch(`${BASE}/api/cron/firm-outreach-autoheal`);
  return r.status;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const started = Date.now();
  let want = WANT_TIP;
  if (!want) {
    // Best-effort: caller should pass --tip= from git rev-parse.
    console.log('[wait] no --tip provided; will accept any non-404 autoheal + ok health');
  }

  console.log(JSON.stringify({ base: BASE, want, limit: LIMIT }));

  while (Date.now() - started < MAX_WAIT_MS) {
    const h = await health().catch(() => ({}));
    const ah = await autohealCode().catch(() => 0);
    const ver = h.version || '';
    const tipOk = !want || ver === want || ver.startsWith(want);
    const ahOk = ah !== 404 && ah !== 0;
    console.log(
      JSON.stringify({
        t: new Date().toISOString(),
        version: ver,
        tipOk,
        autoheal: ah,
        ahOk,
      }),
    );
    if (h.ok && tipOk && ahOk) {
      await sleep(40_000);
      const h2 = await health();
      const ah2 = await autohealCode();
      const ver2 = h2.version || '';
      const tipOk2 = !want || ver2 === want || ver2.startsWith(want);
      if (h2.ok && tipOk2 && ah2 !== 404) {
        console.log('[wait] production stable');
        break;
      }
      console.log('[wait] soak failed; continuing');
    }
    await sleep(20_000);
  }

  const finalHealth = await health();
  const finalAh = await autohealCode();
  if (!finalHealth.ok || finalAh === 404) {
    throw new Error(`Production not healed: health=${JSON.stringify(finalHealth)} autoheal=${finalAh}`);
  }
  if (want && finalHealth.version !== want && !String(finalHealth.version).startsWith(want)) {
    throw new Error(`Production version ${finalHealth.version} != want ${want}`);
  }

  const kicks = [
    '/api/cron/firm-outreach-bootstrap?requalifyOnly=1',
    '/api/cron/firm-outreach-bootstrap?seedAgentCover=1',
    '/api/cron/firm-outreach-psa-sync',
    '/api/cron/firm-outreach-bootstrap?enrichOnly=1&limit=40',
    '/api/cron/firm-outreach-autoheal?noSend=1',
  ];
  for (const path of kicks) {
    const res = await hit(path);
    console.log(
      JSON.stringify({
        kick: path,
        status: res.status,
        mode: res.json?.mode,
        ready: res.json?.countsAfter?.ready_to_send ?? res.json?.queue?.readyToSend,
        error: res.json?.error,
      }),
    );
  }

  const statusBefore = await hit('/api/cron/firm-outreach-status');
  console.log(
    JSON.stringify({
      statusBefore: statusBefore.status,
      ready: statusBefore.json?.queue?.readyToSend,
      sentToday: statusBefore.json?.queue?.sentToday,
      modeHint: statusBefore.json?.config?.sendAllowed,
    }),
  );

  const send = await hit(`/api/cron/firm-outreach-send?limit=${LIMIT}`);
  const s = send.json?.send || send.json || {};
  console.log(
    JSON.stringify({
      sendStatus: send.status,
      mode: send.json?.mode,
      accepted: s.accepted ?? send.json?.accepted,
      sent: s.sent,
      queued: s.queued,
      skipped: s.skipped,
      attempted: s.attempted,
      failed: s.failed,
      skipReasons: s.skipReasons,
      runId: s.runId,
      partial: s.partial,
      resendQuotaRemaining: s.resendQuotaRemaining,
    }),
  );

  // Second pass if queue remains.
  const statusMid = await hit('/api/cron/firm-outreach-status');
  const ready = statusMid.json?.queue?.readyToSend ?? 0;
  let send2 = null;
  if (ready > 0) {
    send2 = await hit(`/api/cron/firm-outreach-send?limit=${LIMIT}`);
    const s2 = send2.json?.send || {};
    console.log(
      JSON.stringify({
        send2Status: send2.status,
        mode: send2.json?.mode,
        accepted: s2.accepted,
        sent: s2.sent,
        skipReasons: s2.skipReasons,
        runId: s2.runId,
      }),
    );
  }

  const preview = await hit('/api/cron/firm-outreach-bootstrap?dryRunPreview=1&limit=40');
  const p = preview.json?.preview || {};
  console.log(
    JSON.stringify({
      previewStatus: preview.status,
      wouldSendCount: p.wouldSendCount,
      campaigns: (p.campaigns || []).map((c) => ({
        id: c.campaignId,
        sentToday: c.sentToday,
        remaining: c.remaining,
        wouldSendCount: c.wouldSendCount,
        selection: c.selection,
      })),
    }),
  );

  const statusAfter = await hit('/api/cron/firm-outreach-status');
  const summary = {
    version: finalHealth.version,
    workerMode: send.json?.mode,
    accepted1: s.accepted ?? 0,
    accepted2: send2?.json?.send?.accepted ?? 0,
    acceptedTotal: (s.accepted ?? 0) + (send2?.json?.send?.accepted ?? 0),
    readyAfter: statusAfter.json?.queue?.readyToSend,
    sentToday: statusAfter.json?.queue?.sentToday,
    autohealUnauth: finalAh,
  };
  console.log('SUMMARY', JSON.stringify(summary));
  if (send.status !== 200) process.exit(1);
  if (send.json?.mode !== 'outreach-worker' && send.json?.mode !== 'send-only') {
    console.error('Unexpected send mode', send.json?.mode);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
