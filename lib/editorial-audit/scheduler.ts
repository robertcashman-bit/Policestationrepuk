import { getAuditConfig } from './config';
import { selectAuditBatch } from './cursor';
import { appendAuditRunLog, formatSuggestedFixesForDigest } from './fix-registry';
import { loadLlmSpendState, saveLlmSpendState } from './llm-state';
import { notifyIfFindings } from './notify';
import { scanBatchFull } from './runner';
import { buildAllUnits } from './units';
import type { AuditFinding } from './types';

export interface EditorialAuditRunResult {
  totalUnits: number;
  batchSize: number;
  batchStartIndex: number;
  nextCursor: number;
  scannedUnitIds: string[];
  findings: AuditFinding[];
  llmCalls: number;
  liveUrlsChecked: number;
  suggestedFixCount: number;
  notification: Awaited<ReturnType<typeof notifyIfFindings>>;
}

export async function runEditorialAudit(opts?: {
  limit?: number;
  skipLiveUrl?: boolean;
  skipLlm?: boolean;
}): Promise<EditorialAuditRunResult> {
  const cfg = getAuditConfig();
  const units = buildAllUnits();
  const batchSize = opts?.limit ?? cfg.batchSize;
  const selection = await selectAuditBatch(units, batchSize);

  const llmState = await loadLlmSpendState();
  const scanned = await scanBatchFull(selection.batch, {
    siteUrl: cfg.siteUrl,
    skipLiveUrl: opts?.skipLiveUrl,
    skipLlm: opts?.skipLlm,
    llmState,
  });

  if (scanned.llmCalls > 0) {
    await saveLlmSpendState({
      llm_calls_this_month: llmState.llm_calls_this_month + scanned.llmCalls,
      llm_month_key: llmState.llm_month_key,
      estimated_spend_usd: llmState.estimated_spend_usd + scanned.llmSpendUsd,
    });
  }

  const suggestedFixCount = scanned.findings.filter((f) => f.proposedFix?.trim()).length;
  appendAuditRunLog({
    date: new Date().toISOString(),
    findingCount: scanned.findings.length,
    suggestedFixCount,
  });

  const notification = await notifyIfFindings(scanned.findings, selection.batch.length, {
    extraHtml: formatSuggestedFixesForDigest(scanned.findings) || undefined,
  });

  return {
    totalUnits: selection.total,
    batchSize,
    batchStartIndex: selection.batchStartIndex,
    nextCursor: selection.nextCursor,
    scannedUnitIds: selection.scannedUnitIds,
    findings: scanned.findings,
    llmCalls: scanned.llmCalls,
    liveUrlsChecked: scanned.liveUrlsChecked,
    suggestedFixCount,
    notification,
  };
}
