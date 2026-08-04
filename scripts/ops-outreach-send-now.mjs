/**
 * Operator: diagnose + optionally apply firm outreach send against production.
 * Secrets come from env (vercel env pull / vercel env run); never logged.
 *
 * Usage:
 *   npx vercel env pull .env.production.local --environment=production --yes
 *   node --env-file=.env.production.local scripts/ops-outreach-send-now.mjs
 *   node --env-file=.env.production.local scripts/ops-outreach-send-now.mjs --apply --limit=45
 */
const BASE = process.env.OUTREACH_BASE_URL || 'https://policestationrepuk.org';
const apply = process.argv.includes('--apply');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) || 45 : 45;

function unquote(v) {
  let s = String(v ?? '').trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
  }
  return s.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
}

function secret() {
  const s = unquote(process.env.CRON_SECRET);
  if (!s) throw new Error('CRON_SECRET missing in env');
  return s;
}

async function hit(path) {
  const s = secret();
  const r = await fetch(BASE + path, {
    headers: {
      Authorization: `Bearer ${s}`,
      'x-cron-secret': s,
    },
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: r.status, json };
}

function summarizePreview(preview) {
  const skipReasons = preview?.skipReasons || {};
  const wouldSend = (preview?.preview || []).filter((r) => r.wouldSend).length;
  return {
    campaignId: preview?.campaignId,
    sentToday: preview?.sentToday,
    remaining: preview?.remaining,
    dailyCap: preview?.dailyCap,
    resendQuotaRemaining: preview?.resendQuotaRemaining,
    wouldSend,
    skipReasons,
    sampleWouldSend: (preview?.preview || []).filter((r) => r.wouldSend).slice(0, 10),
    sampleSkips: (preview?.preview || [])
      .filter((r) => !r.wouldSend)
      .slice(0, 15)
      .map((r) => ({ firm: r.firmName, email: r.email, reason: r.skipReason, status: r.status })),
  };
}

async function main() {
  console.log('[ops-outreach] base=', BASE, 'apply=', apply, 'limit=', limit);

  const status = await hit('/api/cron/firm-outreach-status');
  console.log('[ops-outreach] status', status.status);
  if (status.status !== 200) {
    console.log(JSON.stringify(status.json, null, 2));
    process.exit(1);
  }
  const cfg = status.json?.config || status.json || {};
  console.log(
    JSON.stringify(
      {
        requireApproval: cfg.requireApproval ?? status.json?.requireApproval,
        sendEnabled: cfg.sendEnabled ?? status.json?.sendEnabled,
        sendAllowed: cfg.sendAllowed ?? status.json?.sendAllowed,
        sendHealthy: cfg.sendHealthy ?? status.json?.sendHealthy,
        dailyCap: cfg.dailyCap ?? status.json?.dailyCap,
        paused: cfg.paused ?? status.json?.paused,
        queue: status.json?.queue,
        counts: status.json?.counts,
      },
      null,
      2,
    ),
  );

  const preview = await hit(`/api/cron/firm-outreach-bootstrap?dryRunPreview=1&limit=${Math.max(limit, 60)}`);
  console.log('[ops-outreach] dryRunPreview', preview.status);
  if (preview.status !== 200) {
    console.log(JSON.stringify(preview.json, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(summarizePreview(preview.json.preview || preview.json), null, 2));

  if (!apply) {
    console.log('[ops-outreach] dry run only — pass --apply to send');
    return;
  }

  const send = await hit(`/api/cron/firm-outreach-send?limit=${limit}`);
  console.log('[ops-outreach] send', send.status);
  console.log(
    JSON.stringify(
      {
        mode: send.json?.mode,
        skipped: send.json?.skipped,
        reason: send.json?.reason,
        send: send.json?.send,
        elapsedMs: send.json?.elapsedMs,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('[ops-outreach] failed', err.message || err);
  process.exit(1);
});
