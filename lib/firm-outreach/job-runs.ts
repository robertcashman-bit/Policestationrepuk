/**
 * Durable scheduler / autoheal run records (KV-backed).
 * Do not rely solely on ephemeral server logs.
 */
import { getKV } from '@/lib/kv';
import type { OutreachWorkspaceId } from './workspaces';

export type JobRunType = 'outreach_worker' | 'autoheal' | 'daily_report' | 'backfill';
export type JobRunStatus = 'started' | 'success' | 'partial' | 'failed' | 'skipped';

export interface OutreachJobRun {
  workspace: OutreachWorkspaceId | 'both';
  runId: string;
  runType: JobRunType;
  started: string;
  finished?: string;
  status: JobRunStatus;
  eligibleBefore?: number;
  pendingBefore?: number;
  claimed?: number;
  attempted?: number;
  accepted?: number;
  failed?: number;
  retried?: number;
  suppressed?: number;
  eligibleAfter?: number;
  pendingAfter?: number;
  providerCapacityBefore?: number;
  providerCapacityAfter?: number;
  repairsPerformed?: string[];
  errorSummary?: string;
  meta?: Record<string, unknown>;
}

const RUN_KEY = (runId: string) => `firmoutreach:jobrun:${runId}`;
const LATEST_KEY = (runType: JobRunType, workspace: string) =>
  `firmoutreach:jobrun:latest:${runType}:${workspace}`;
const INDEX_KEY = (runType: JobRunType) => `firmoutreach:jobrun:index:${runType}`;

export async function saveJobRun(run: OutreachJobRun): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(RUN_KEY(run.runId), run, { ex: 60 * 60 * 24 * 45 });
  await kv.set(LATEST_KEY(run.runType, run.workspace), run, { ex: 60 * 60 * 24 * 45 });
  try {
    const idx = INDEX_KEY(run.runType);
    await kv.lpush(idx, run.runId);
    await kv.ltrim(idx, 0, 199);
    await kv.expire(idx, 60 * 60 * 24 * 45);
  } catch {
    /* best-effort index */
  }
}

export async function getLatestJobRun(
  runType: JobRunType,
  workspace: OutreachWorkspaceId | 'both' = 'both',
): Promise<OutreachJobRun | null> {
  const kv = getKV();
  if (!kv) return null;
  const v = await kv.get<OutreachJobRun>(LATEST_KEY(runType, workspace));
  return v ?? null;
}

export async function listRecentJobRuns(
  runType: JobRunType,
  limit = 20,
): Promise<OutreachJobRun[]> {
  const kv = getKV();
  if (!kv) return [];
  try {
    const ids = (await kv.lrange(INDEX_KEY(runType), 0, limit - 1)) as string[];
    const out: OutreachJobRun[] = [];
    for (const id of ids ?? []) {
      const run = await kv.get<OutreachJobRun>(RUN_KEY(String(id)));
      if (run) out.push(run);
    }
    return out;
  } catch {
    return [];
  }
}

export function newJobRunId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
