/**
 * Parse firm-outreach-production-kick.mjs tee logs and decide whether verify passed.
 *
 * Kick prints each step as:
 *   [ok|warn|fail] <label> — HTTP <status>
 *   <body…>   (often JSON on the following line(s))
 */

export type KickEvidenceMode = 'status_only' | 'live_send';

export interface KickEvidenceResult {
  ok: boolean;
  reason: string;
  accepted?: number;
  skippedReason?: string | null;
}

interface ParsedKickStep {
  tag: 'ok' | 'warn' | 'fail';
  label: string;
  status: number;
  body: string;
  json: Record<string, unknown> | null;
}

const STEP_HEADER =
  /^\[(ok|warn|fail)\]\s+(.+?)\s+—\s+HTTP\s+(\d+)\s*$/;

/** Hard failures: env/readiness/approval — accepted=0 must not soft-pass. */
const HARD_SKIP_RE =
  /env_invalid|RESEND_API_KEY|Send blocked|Unknown campaign|send[_ ]?not[_ ]?ready|not configured|REQUIRE_APPROVAL|approval-required/i;

export function parseKickLogSteps(log: string): ParsedKickStep[] {
  const lines = log.split(/\r?\n/);
  const steps: ParsedKickStep[] = [];
  let current: Omit<ParsedKickStep, 'json'> | null = null;
  const bodyLines: string[] = [];

  const flush = () => {
    if (!current) return;
    const body = bodyLines.join('\n').trim();
    bodyLines.length = 0;
    steps.push({
      ...current,
      body,
      json: tryParseJsonObject(body),
    });
    current = null;
  };

  for (const line of lines) {
    const m = line.match(STEP_HEADER);
    if (m) {
      flush();
      current = {
        tag: m[1] as 'ok' | 'warn' | 'fail',
        label: m[2]!,
        status: Number(m[3]),
        body: '',
      };
      continue;
    }
    if (current) bodyLines.push(line);
  }
  flush();
  return steps;
}

function tryParseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  // Body may include trailing noise after JSON — try full parse, then first {...} slice.
  try {
    const v = JSON.parse(trimmed) as unknown;
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const v = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

function nestedRecord(
  obj: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  if (!obj) return null;
  const v = obj[key];
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function readAccepted(json: Record<string, unknown> | null): number | null {
  if (!json) return null;
  const send = nestedRecord(json, 'send');
  const fromSend = send?.accepted;
  if (typeof fromSend === 'number' && Number.isFinite(fromSend)) return fromSend;
  const top = json.accepted;
  if (typeof top === 'number' && Number.isFinite(top)) return top;
  return null;
}

function readSkippedReason(json: Record<string, unknown> | null): string | null {
  if (!json) return null;
  const send = nestedRecord(json, 'send');
  const fromSend = send?.skippedReason;
  if (typeof fromSend === 'string' && fromSend.trim()) return fromSend.trim();
  const top = json.skippedReason;
  if (typeof top === 'string' && top.trim()) return top.trim();
  const reason = json.reason;
  if (typeof reason === 'string' && reason.trim()) return reason.trim();
  return null;
}

function isHardSkip(json: Record<string, unknown> | null, skippedReason: string | null): boolean {
  if (!json && !skippedReason) return false;
  if (json?.mode === 'approval-required') return true;
  if (json?.skipped === true) return true;
  if (json?.ok === false) return true;
  if (skippedReason && HARD_SKIP_RE.test(skippedReason)) return true;
  return false;
}

export function evaluateKickEvidence(
  log: string,
  mode: KickEvidenceMode,
): KickEvidenceResult {
  const steps = parseKickLogSteps(log);

  if (mode === 'status_only') {
    const status = steps.find((s) => /Outreach send health \(status\)/i.test(s.label));
    if (!status) {
      return { ok: false, reason: 'Status-only kick did not run status step' };
    }
    if (status.tag !== 'ok') {
      return {
        ok: false,
        reason: `Status step not ok (tag=${status.tag}, HTTP ${status.status})`,
      };
    }
    return { ok: true, reason: 'Status-only verify — status step ok' };
  }

  // live_send
  const flush = [...steps].reverse().find((s) => /Send flush/i.test(s.label));
  if (!flush) {
    return { ok: false, reason: 'No Send flush step in kick log' };
  }
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

  // accepted === 0 without hard skip → empty inventory / caps (soft pass)
  return {
    ok: true,
    reason:
      'Flush ran with accepted=0 (empty/eligible inventory or caps) — soft pass',
    accepted: 0,
    skippedReason,
  };
}
