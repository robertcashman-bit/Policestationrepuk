import { scanFeeRateClaims } from './fee-check';
import { proposedFixForCode } from './fixes';
import { fetchLiveUrlFindings } from './live-url';
import { runLlmFactCheck, shouldRunLlm } from './llm-check';
import { paceSourcingViolation } from './pace-sourcing';
import { scanText } from './rules';
import { scanContentSourcesMapping } from './sources-check';
import type { AuditFinding, AuditUnit, RedFlag } from './types';

export function findingFingerprint(unitId: string, code: string): string {
  return `${unitId}:${code}`;
}

function isNotifySeverity(severity: string): severity is AuditFinding['severity'] {
  return severity === 'PROBLEM' || severity === 'REVIEW';
}

function flagsToFindings(unit: AuditUnit, flags: RedFlag[]): AuditFinding[] {
  return flags
    .filter((f) => isNotifySeverity(f.severity))
    .map((flag) => ({
      fingerprint: findingFingerprint(unit.id, flag.code),
      unitId: unit.id,
      url: unit.url,
      sectionTitle: unit.sectionTitle,
      sourceFile: unit.sourceFile,
      severity: flag.severity as AuditFinding['severity'],
      code: flag.code,
      reason: flag.message,
      proposedFix: proposedFixForCode(flag.code),
      excerpt: flag.excerpt,
    }));
}

/** Rules + multi-source checks (PACE, LAA fees, content-sources map). Sync; no network/LLM. */
export function scanUnit(unit: AuditUnit): AuditFinding[] {
  const flags: RedFlag[] = [...scanText(unit.text), ...scanFeeRateClaims(unit.text)];

  if (paceSourcingViolation(unit.text)) {
    flags.push({
      severity: 'REVIEW',
      code: 'pace-sourcing',
      message: 'References PACE without a specific Code section or statutory cite',
      excerpt: unit.text.slice(0, 120).replace(/\s+/g, ' ').trim(),
    });
  }

  flags.push(...scanContentSourcesMapping(unit, flags));

  return flagsToFindings(unit, flags);
}

export function scanBatch(units: AuditUnit[]): AuditFinding[] {
  const out: AuditFinding[] = [];
  const seen = new Set<string>();
  for (const unit of units) {
    for (const finding of scanUnit(unit)) {
      if (seen.has(finding.fingerprint)) continue;
      seen.add(finding.fingerprint);
      out.push(finding);
    }
  }
  return out;
}

export type ScanBatchFullOptions = {
  siteUrl?: string;
  /** Skip live HTTP (tests / offline). Default: fetch. */
  skipLiveUrl?: boolean;
  /** Skip LLM even if key present. */
  skipLlm?: boolean;
  llmState: { llm_calls_this_month: number; estimated_spend_usd: number };
};

export type ScanBatchFullResult = {
  findings: AuditFinding[];
  llmCalls: number;
  llmSpendUsd: number;
  liveUrlsChecked: number;
};

/**
 * Full multi-source batch: rules/sources → live URL (once per path) → GPT when flagged.
 */
export async function scanBatchFull(
  units: AuditUnit[],
  opts: ScanBatchFullOptions,
): Promise<ScanBatchFullResult> {
  const findings: AuditFinding[] = [];
  const seen = new Set<string>();
  const push = (list: AuditFinding[]) => {
    for (const f of list) {
      if (seen.has(f.fingerprint)) continue;
      seen.add(f.fingerprint);
      findings.push(f);
    }
  };

  const byUrl = new Map<string, AuditFinding[]>();
  for (const unit of units) {
    const unitFindings = scanUnit(unit);
    push(unitFindings);
    const bucket = byUrl.get(unit.url) ?? [];
    bucket.push(...unitFindings);
    byUrl.set(unit.url, bucket);
  }

  let liveUrlsChecked = 0;
  if (!opts.skipLiveUrl) {
    for (const url of byUrl.keys()) {
      liveUrlsChecked += 1;
      const live = await fetchLiveUrlFindings(url, {
        siteUrl: opts.siteUrl,
        unitId: `live:${url}`,
      });
      push(live);
    }
  }

  let llmCalls = 0;
  let llmSpendUsd = 0;
  const llmState = { ...opts.llmState };

  if (!opts.skipLlm) {
    for (const unit of units) {
      const ruleFindings = byUrl.get(unit.url) ?? [];
      // Prefer findings for this unit id; fall back to URL-level rules flags
      const unitRuleFindings = ruleFindings.filter((f) => f.unitId === unit.id);
      const flagged = unitRuleFindings.length > 0 ? unitRuleFindings : ruleFindings;

      if (!shouldRunLlm(unit, flagged, llmCalls, llmState)) continue;

      try {
        const llm = await runLlmFactCheck(unit);
        push(llm.findings);
        llmCalls += 1;
        llmState.llm_calls_this_month += 1;
        llmState.estimated_spend_usd += llm.costUsd;
        llmSpendUsd += llm.costUsd;
      } catch (e) {
        push([
          {
            fingerprint: findingFingerprint(unit.id, 'llm-check-failed'),
            unitId: unit.id,
            url: unit.url,
            sectionTitle: unit.sectionTitle,
            sourceFile: unit.sourceFile,
            severity: 'REVIEW',
            code: 'llm-check-failed',
            reason: `LLM check failed: ${e instanceof Error ? e.message : String(e)}`,
            proposedFix: proposedFixForCode('llm-check-failed'),
          },
        ]);
      }
    }
  }

  return { findings, llmCalls, llmSpendUsd, liveUrlsChecked };
}
