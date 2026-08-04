/**
 * Forget prior firm-outreach sends so prospects are treated as never emailed.
 * Keeps unsubscribe / bounce / complaint / joined / manual suppressions.
 */
import { deleteKeys, scanKeys } from './kv-scan';
import { reindexProspectStatuses } from './reindex-prospects';
import { getAdminPauseState, isOutreachPaused, setAdminPauseState } from './pause-state';
import {
  countProspectsByStatus,
  getProspect,
  isSuppressed,
  listAllProspectIds,
  listAllSuppressions,
  listProspectIdsByStatus,
  saveProspect,
} from './storage';
import {
  countEmailJobsByStatus,
  getEmailJob,
  listEmailJobIdsByStatus,
} from './email-jobs/storage';
import { invalidateOutreachSummaryCache } from './outreach/activity-report';
import { getKV } from '@/lib/kv';
import { readIndexMembers } from '@/lib/kv-atomic';
import type { FirmProspect, FirmProspectStatus } from './types';
import type { EmailJobStatus } from '@robertcashman/firm-outreach-core';

const TERMINAL_STATUSES = new Set<FirmProspectStatus>([
  'unsubscribed',
  'bounced',
  'joined_whatsapp',
]);

const SOFT_EXCLUDED_REASONS = new Set([
  'duplicate_email',
  'firm_cooldown',
  'send_failed',
  'not_kent_for_agent_cover',
  'duplicate_firm_ready',
  'archive_only_not_on_laa_or_dscc',
]);

const JOB_STATUSES: EmailJobStatus[] = [
  'pending',
  'claimed',
  'processing',
  'accepted',
  'delivered',
  'deferred',
  'bounced',
  'complained',
  'unsubscribed',
  'suppressed',
  'failed',
  'retry_scheduled',
  'permanently_failed',
];

const PROSPECT_PREFIX = 'firmprospect:';

function isSoftExcludedReason(reason: string | undefined): boolean {
  if (!reason) return false;
  if (SOFT_EXCLUDED_REASONS.has(reason)) return true;
  return reason.startsWith('duplicate');
}

function isProspectDocumentKey(key: string): boolean {
  if (!key.startsWith(PROSPECT_PREFIX)) return false;
  const rest = key.slice(PROSPECT_PREFIX.length);
  if (!rest || rest.includes(':')) return false;
  if (rest === 'index') return false;
  return true;
}

export type ResetSendHistoryStats = {
  dryRun: boolean;
  pausedBefore: boolean;
  suppressionsBefore: number;
  suppressionsAfter: number;
  statusBefore: Record<string, number>;
  statusAfter: Record<string, number>;
  jobsBefore: Partial<Record<string, number>>;
  sendsDeleted: number;
  sendSecondaryDeleted: number;
  jobsDeleted: number;
  jobSecondaryDeleted: number;
  countersDeleted: number;
  prospectsScanned: number;
  prospectsCleared: number;
  prospectsPromotedReady: number;
  prospectsSkippedTerminal: number;
  prospectsSkippedSuppressed: number;
  reindex: Awaited<ReturnType<typeof reindexProspectStatuses>> | null;
};

/** Union of master index + status indexes + SCAN — indexes alone can be incomplete. */
async function collectAllProspectIds(): Promise<string[]> {
  const statuses: FirmProspectStatus[] = [
    'discovered',
    'enriching',
    'enriched',
    'ready_to_send',
    'sent',
    'bounced',
    'unsubscribed',
    'joined_whatsapp',
    'excluded',
    'no_email',
  ];
  const ids = new Set<string>();
  for (const id of await listAllProspectIds()) ids.add(id);
  for (const status of statuses) {
    for (const id of await listProspectIdsByStatus(status)) ids.add(id);
  }
  for (const key of await scanKeys('firmprospect:fop_*', { count: 300, maxIterations: 80 })) {
    if (!isProspectDocumentKey(key)) continue;
    ids.add(key.slice(PROSPECT_PREFIX.length));
  }
  return [...ids];
}

async function collectSendKeysFromIndexesAndJobs(): Promise<{
  sendKeys: string[];
  secondaryKeys: string[];
}> {
  const sendIds = new Set<string>(await readIndexMembers('firmoutreach:send:index'));

  for (const status of JOB_STATUSES) {
    const ids = await listEmailJobIdsByStatus(status, 5_000);
    for (const id of ids) {
      const job = await getEmailJob(id);
      const sendId = (job as { sendId?: string } | null)?.sendId;
      if (sendId) sendIds.add(sendId);
    }
  }

  for (const key of await scanKeys('firmoutreach:send:fos_*', { count: 300, maxIterations: 60 })) {
    const id = key.slice('firmoutreach:send:'.length);
    if (id.startsWith('fos_')) sendIds.add(id);
  }

  const sendKeys = [...sendIds].map((id) => `firmoutreach:send:${id}`);
  const secondaryKeys = [
    'firmoutreach:send:index',
    ...(await scanKeys('firmoutreach:send:email:*', { count: 300, maxIterations: 40 })),
    ...(await scanKeys('firmoutreach:send:resend:*', { count: 300, maxIterations: 40 })),
    ...(await scanKeys('firmoutreach:send:claim:*', { count: 100, maxIterations: 20 })),
  ];

  return { sendKeys, secondaryKeys };
}

async function collectJobKeys(): Promise<{ jobKeys: string[]; secondaryKeys: string[] }> {
  const jobIds = new Set<string>(await readIndexMembers('firmoutreach:job:index'));
  for (const status of JOB_STATUSES) {
    for (const id of await listEmailJobIdsByStatus(status, 5_000)) jobIds.add(id);
  }
  for (const key of await scanKeys('firmoutreach:job:foj_*', { count: 300, maxIterations: 60 })) {
    const id = key.slice('firmoutreach:job:'.length);
    if (id.startsWith('foj_')) jobIds.add(id);
  }

  const jobKeys = [...jobIds].map((id) => `firmoutreach:job:${id}`);
  const secondaryKeys = [
    'firmoutreach:job:index',
    'firmoutreach:job:pending_z',
    ...JOB_STATUSES.map((s) => `firmoutreach:job:status:${s}`),
    ...(await scanKeys('firmoutreach:job:idem:*', { count: 300, maxIterations: 40 })),
    ...(await scanKeys('firmoutreach:job:resend:*', { count: 200, maxIterations: 30 })),
    ...(await scanKeys('firmoutreach:job:send:*', { count: 200, maxIterations: 30 })),
    ...(await scanKeys('firmoutreach:job:lease:*', { count: 100, maxIterations: 20 })),
  ];
  return { jobKeys, secondaryKeys };
}

async function collectCounterKeys(): Promise<string[]> {
  const patterns = [
    'firmoutreach:daily:*',
    'firmoutreach:hourly:*',
    'firmoutreach:resend:count:*',
    'firmoutreach:digest:sent:*',
    'firmoutreach:approval-email:*',
    'firmoutreach:admin:summary:*',
    'firmoutreach:cursor:enrich*',
    'firmoutreach:runlog:*',
  ];
  const keys: string[] = [];
  for (const pattern of patterns) {
    keys.push(...(await scanKeys(pattern, { count: 200, maxIterations: 30 })));
  }
  return keys;
}

function clearProspectSendState(prospect: FirmProspect): {
  next: FirmProspect;
  promotedReady: boolean;
} {
  const previousStatus = prospect.status;
  const next: FirmProspect = {
    ...prospect,
    lastEmailAt: undefined,
    nextEligibleAt: undefined,
    waLinkClickedAt: undefined,
    sequenceStep: 0,
    updatedAt: new Date().toISOString(),
  };

  if (isSoftExcludedReason(prospect.excludedReason)) {
    next.excludedReason = undefined;
  }

  let promotedReady = false;
  if (!TERMINAL_STATUSES.has(previousStatus)) {
    if (prospect.email?.trim()) {
      next.status = 'ready_to_send';
      promotedReady = previousStatus !== 'ready_to_send';
    } else if (previousStatus === 'sent' || previousStatus === 'excluded') {
      next.status = 'no_email';
    }
  }

  return { next, promotedReady };
}

export async function resetFirmOutreachSendHistory(opts?: {
  dryRun?: boolean;
  /** When true, set admin pause for the duration of an apply run. */
  ensurePaused?: boolean;
}): Promise<ResetSendHistoryStats> {
  const dryRun = opts?.dryRun !== false;
  const ensurePaused = opts?.ensurePaused !== false;
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');

  const pausedBefore = await isOutreachPaused();
  if (!dryRun && !pausedBefore) {
    if (!ensurePaused) {
      throw new Error(
        'Refuse to apply reset while outreach is not paused. Pause first or pass ensurePaused.',
      );
    }
    await setAdminPauseState(true);
  }

  const suppressionsBefore = (await listAllSuppressions()).length;
  const statusBefore = await countProspectsByStatus();
  const jobsBefore = await countEmailJobsByStatus();

  const { sendKeys, secondaryKeys: sendSecondaryKeys } = await collectSendKeysFromIndexesAndJobs();
  const { jobKeys, secondaryKeys: jobSecondaryKeys } = await collectJobKeys();
  const counterKeys = await collectCounterKeys();
  const prospectIds = await collectAllProspectIds();

  let prospectsCleared = 0;
  let prospectsPromotedReady = 0;
  let prospectsSkippedTerminal = 0;
  let prospectsSkippedSuppressed = 0;
  const clearedProspects: Array<{
    id: string;
    previousStatus: FirmProspectStatus;
    next: FirmProspect;
  }> = [];

  for (const id of prospectIds) {
    const prospect = await getProspect(id);
    if (!prospect) continue;

    if (TERMINAL_STATUSES.has(prospect.status)) {
      prospectsSkippedTerminal++;
      continue;
    }

    if (prospect.email && (await isSuppressed(prospect.email))) {
      prospectsSkippedSuppressed++;
      continue;
    }

    const { next, promotedReady } = clearProspectSendState(prospect);
    const changed =
      prospect.lastEmailAt !== next.lastEmailAt ||
      prospect.nextEligibleAt !== next.nextEligibleAt ||
      prospect.waLinkClickedAt !== next.waLinkClickedAt ||
      prospect.sequenceStep !== next.sequenceStep ||
      prospect.excludedReason !== next.excludedReason ||
      prospect.status !== next.status;

    if (!changed) continue;

    prospectsCleared++;
    if (promotedReady) prospectsPromotedReady++;
    clearedProspects.push({ id, previousStatus: prospect.status, next });
  }

  const stats: ResetSendHistoryStats = {
    dryRun,
    pausedBefore,
    suppressionsBefore,
    suppressionsAfter: suppressionsBefore,
    statusBefore,
    statusAfter: statusBefore,
    jobsBefore,
    sendsDeleted: sendKeys.length,
    sendSecondaryDeleted: sendSecondaryKeys.length,
    jobsDeleted: jobKeys.length,
    jobSecondaryDeleted: jobSecondaryKeys.length,
    countersDeleted: counterKeys.length,
    prospectsScanned: prospectIds.length,
    prospectsCleared,
    prospectsPromotedReady,
    prospectsSkippedTerminal,
    prospectsSkippedSuppressed,
    reindex: null,
  };

  if (dryRun) return stats;

  stats.sendsDeleted = await deleteKeys(sendKeys);
  stats.sendSecondaryDeleted = await deleteKeys(sendSecondaryKeys);
  stats.jobsDeleted = await deleteKeys(jobKeys);
  stats.jobSecondaryDeleted = await deleteKeys(jobSecondaryKeys);
  stats.countersDeleted = await deleteKeys(counterKeys);

  for (const row of clearedProspects) {
    await saveProspect(row.next, row.previousStatus);
  }

  stats.reindex = await reindexProspectStatuses();
  await invalidateOutreachSummaryCache();

  stats.suppressionsAfter = (await listAllSuppressions()).length;
  stats.statusAfter = await countProspectsByStatus();

  if (stats.suppressionsAfter < stats.suppressionsBefore) {
    throw new Error(
      `Suppression count dropped during reset (${stats.suppressionsBefore} → ${stats.suppressionsAfter}). Aborting further ops.`,
    );
  }

  if ((await getAdminPauseState()) !== true) {
    await setAdminPauseState(true);
  }

  return stats;
}
