#!/usr/bin/env node
/**
 * Pure-Node CLI for kick-log evidence (no tsx / npm install required in GHA).
 * Logic mirrors lib/firm-outreach/verify-kick-evidence.ts (covered by vitest).
 *
 * Usage:
 *   node scripts/firm-outreach-verify-kick-evidence.mjs status_only /tmp/outreach-kick.log
 *   node scripts/firm-outreach-verify-kick-evidence.mjs live_send /tmp/outreach-kick.log
 */
import { readFileSync } from 'node:fs';

const mode = process.argv[2];
const logPath = process.argv[3] || '/tmp/outreach-kick.log';

if (mode !== 'status_only' && mode !== 'live_send') {
  console.error('Usage: firm-outreach-verify-kick-evidence.mjs <status_only|live_send> [logPath]');
  process.exit(2);
}

const STEP_HEADER = /^\[(ok|warn|fail)\]\s+(.+?)\s+—\s+HTTP\s+(\d+)\s*$/;
const HARD_SKIP_RE =
  /env_invalid|RESEND_API_KEY|Send blocked|Unknown campaign|send[_ ]?not[_ ]?ready|not configured|REQUIRE_APPROVAL|approval-required/i;

function tryParseJsonObject(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const v = JSON.parse(trimmed);
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  } catch {
    /* fall through */
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const v = JSON.parse(trimmed.slice(start, end + 1));
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch {
      return null;
    }
  }
  return null;
}

function parseKickLogSteps(log) {
  const lines = log.split(/\r?\n/);
  const steps = [];
  let current = null;
  const bodyLines = [];

  const flush = () => {
    if (!current) return;
    const body = bodyLines.join('\n').trim();
    bodyLines.length = 0;
    steps.push({ ...current, body, json: tryParseJsonObject(body) });
    current = null;
  };

  for (const line of lines) {
    const m = line.match(STEP_HEADER);
    if (m) {
      flush();
      current = { tag: m[1], label: m[2], status: Number(m[3]), body: '' };
      continue;
    }
    if (current) bodyLines.push(line);
  }
  flush();
  return steps;
}

function nestedRecord(obj, key) {
  if (!obj) return null;
  const v = obj[key];
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  return null;
}

function readAccepted(json) {
  if (!json) return null;
  const fromSend = nestedRecord(json, 'send')?.accepted;
  if (typeof fromSend === 'number' && Number.isFinite(fromSend)) return fromSend;
  if (typeof json.accepted === 'number' && Number.isFinite(json.accepted)) return json.accepted;
  return null;
}

function readSkippedReason(json) {
  if (!json) return null;
  const fromSend = nestedRecord(json, 'send')?.skippedReason;
  if (typeof fromSend === 'string' && fromSend.trim()) return fromSend.trim();
  if (typeof json.skippedReason === 'string' && json.skippedReason.trim()) {
    return json.skippedReason.trim();
  }
  if (typeof json.reason === 'string' && json.reason.trim()) return json.reason.trim();
  return null;
}

function isHardSkip(json, skippedReason) {
  if (!json && !skippedReason) return false;
  if (json?.mode === 'approval-required') return true;
  if (json?.skipped === true) return true;
  if (json?.ok === false) return true;
  if (skippedReason && HARD_SKIP_RE.test(skippedReason)) return true;
  return false;
}

function evaluateKickEvidence(log, evidenceMode) {
  const steps = parseKickLogSteps(log);

  if (evidenceMode === 'status_only') {
    const status = steps.find((s) => /Outreach send health \(status\)/i.test(s.label));
    if (!status) return { ok: false, reason: 'Status-only kick did not run status step' };
    if (status.tag !== 'ok') {
      return {
        ok: false,
        reason: `Status step not ok (tag=${status.tag}, HTTP ${status.status})`,
      };
    }
    return { ok: true, reason: 'Status-only verify — status step ok' };
  }

  const flush = [...steps].reverse().find((s) => /Send flush/i.test(s.label));
  if (!flush) return { ok: false, reason: 'No Send flush step in kick log' };
  if (flush.tag !== 'ok') {
    return {
      ok: false,
      reason: `Send flush not ok (tag=${flush.tag}, HTTP ${flush.status})`,
    };
  }

  const accepted = readAccepted(flush.json);
  const skippedReason = readSkippedReason(flush.json);

  if (isHardSkip(flush.json, skippedReason)) {
    return {
      ok: false,
      reason: `Send flush hard-skipped: ${skippedReason ?? flush.json?.mode ?? 'skipped'}`,
      accepted: accepted ?? 0,
      skippedReason,
    };
  }

  if (accepted == null) {
    return {
      ok: false,
      reason: 'Send flush ok but response JSON missing send.accepted',
      skippedReason,
    };
  }

  if (accepted >= 1) {
    return {
      ok: true,
      reason: `Flush accepted=${accepted} — live send verified`,
      accepted,
      skippedReason,
    };
  }

  return {
    ok: true,
    reason: 'Flush ran with accepted=0 (empty/eligible inventory or caps) — soft pass',
    accepted: 0,
    skippedReason,
  };
}

const log = readFileSync(logPath, 'utf8');
const result = evaluateKickEvidence(log, mode);
console.log(JSON.stringify(result));
if (!result.ok) {
  console.error(result.reason);
  process.exit(1);
}
console.log(result.reason);
process.exit(0);
