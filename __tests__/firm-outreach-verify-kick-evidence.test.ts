import { describe, expect, it } from 'vitest';
import {
  evaluateKickEvidence,
  parseKickLogSteps,
} from '@/lib/firm-outreach/verify-kick-evidence';

describe('parseKickLogSteps', () => {
  it('pairs step headers with following JSON body lines', () => {
    const log = [
      '[ok] Outreach send health (status) — HTTP 200',
      '{"ok":true,"ready":true}',
      '[ok] Send flush (bounded) — HTTP 200',
      '{"ok":true,"mode":"send-only","send":{"accepted":2,"skippedReason":null}}',
    ].join('\n');
    const steps = parseKickLogSteps(log);
    expect(steps).toHaveLength(2);
    expect(steps[1]?.label).toContain('Send flush');
    expect(steps[1]?.json).toMatchObject({ send: { accepted: 2 } });
  });
});

describe('evaluateKickEvidence status_only', () => {
  it('requires [ok] status, not merely the label', () => {
    const warn = [
      '[warn] Outreach send health (status) — HTTP 503',
      '{"error":"down"}',
    ].join('\n');
    expect(evaluateKickEvidence(warn, 'status_only').ok).toBe(false);

    const ok = [
      '[ok] Outreach send health (status) — HTTP 200',
      '{"ok":true}',
    ].join('\n');
    expect(evaluateKickEvidence(ok, 'status_only').ok).toBe(true);
  });
});

describe('evaluateKickEvidence live_send', () => {
  it('reads nested send.accepted from the body line after the flush header', () => {
    const log = [
      '[ok] Pre-flight email probes — HTTP 200',
      '{"ok":true,"messageId":"probe-only"}',
      '[ok] Send flush (bounded) — HTTP 200',
      '{"ok":true,"mode":"send-only","send":{"accepted":3}}',
    ].join('\n');
    const r = evaluateKickEvidence(log, 'live_send');
    expect(r.ok).toBe(true);
    expect(r.accepted).toBe(3);
  });

  it('fails when accepted=0 with env_invalid skippedReason', () => {
    const log = [
      '[ok] Send flush (bounded) — HTTP 200',
      '{"ok":true,"mode":"send-only","send":{"accepted":0,"skippedReason":"env_invalid:RESEND_API_KEY"}}',
    ].join('\n');
    const r = evaluateKickEvidence(log, 'live_send');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/hard-skipped|env_invalid/i);
  });

  it('fails approval-required skipped sends', () => {
    const log = [
      '[ok] Send flush (bounded) — HTTP 200',
      '{"ok":true,"mode":"approval-required","skipped":true,"reason":"FIRM_OUTREACH_REQUIRE_APPROVAL=true"}',
    ].join('\n');
    expect(evaluateKickEvidence(log, 'live_send').ok).toBe(false);
  });

  it('soft-passes empty inventory accepted=0 without hard skip', () => {
    const log = [
      '[ok] Send flush (bounded) — HTTP 200',
      '{"ok":true,"mode":"send-only","send":{"accepted":0}}',
    ].join('\n');
    const r = evaluateKickEvidence(log, 'live_send');
    expect(r.ok).toBe(true);
    expect(r.accepted).toBe(0);
  });

  it('fails when flush header is ok but accepted is missing (probe-only trap)', () => {
    const log = [
      '[ok] Send flush (bounded) — HTTP 200',
      '{"ok":true,"mode":"send-only"}',
    ].join('\n');
    expect(evaluateKickEvidence(log, 'live_send').ok).toBe(false);
  });
});
