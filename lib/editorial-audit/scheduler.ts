import { getAuditConfig } from './config';
import { selectAuditBatch } from './cursor';
import { appendAuditRunLog, collectSafeFixPatches, formatSafeFixPatchesForDigest } from './fix-registry';
import { openAuditPullRequest } from './github-pr';
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
  prUrl?: string;
  prError?: string;
  safePatchCount: number;
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

  const patches = collectSafeFixPatches(scanned.findings);
  let prUrl: string | undefined;
  let prError: string | undefined;
  if (patches.length > 0 && cfg.githubToken) {
    const pr = await openAuditPullRequest(patches);
    prUrl = pr.url;
    prError = pr.error;
  }

  appendAuditRunLog({
    date: new Date().toISOString(),
    findingCount: scanned.findings.length,
    patches,
    prUrl,
    prError,
  });

  // Attach safe-patch HTML for the digest when findings exist
  const findingsForNotify: AuditFinding[] = scanned.findings;
  const patchHtml = formatSafeFixPatchesForDigest(patches);
  const notification = await notifyIfFindings(findingsForNotify, selection.batch.length, {
    extraHtml: patchHtml || undefined,
    prUrl,
    prError,
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
    prUrl,
    prError,
    safePatchCount: patches.length,
    notification,
  };
}
