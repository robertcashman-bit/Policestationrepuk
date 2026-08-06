/**
 * Rebuild prospect indexes as Redis SETs.
 * npx tsx scripts/firm-outreach-reindex.ts
 */
import { getKV } from '@/lib/kv';
import { scanKeys } from './kv-scan';
import type { FirmProspectStatus } from './types';
import { getProspect, listAllProspectIds, listProspectIdsByStatus } from './storage';

const PROSPECT_INDEX = 'firmprospect:index';
const PROSPECT_STATUS_INDEX = 'firmprospect:status:';
const PROSPECT_FIRM_INDEX = 'firmprospect:firm:';
const PROSPECT_PREFIX = 'firmprospect:';

function statusIndexKey(status: FirmProspectStatus): string {
  return `${PROSPECT_STATUS_INDEX}${status}`;
}

const ALL_STATUSES: FirmProspectStatus[] = [
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

function isProspectDocumentKey(key: string): boolean {
  if (!key.startsWith(PROSPECT_PREFIX)) return false;
  const rest = key.slice(PROSPECT_PREFIX.length);
  if (!rest || rest.includes(':')) return false;
  if (rest === 'index') return false;
  return true;
}

async function collectProspectIds(): Promise<string[]> {
  const ids = new Set<string>();

  for (const id of await listAllProspectIds()) ids.add(id);

  for (const status of ALL_STATUSES) {
    for (const id of await listProspectIdsByStatus(status)) ids.add(id);
  }

  // Full DB walk — prior 80×300 cap could under-collect after an index wipe.
  for (const key of await scanKeys('firmprospect:fop_*', { count: 500, maxIterations: 500 })) {
    if (!isProspectDocumentKey(key)) continue;
    ids.add(key.slice(PROSPECT_PREFIX.length));
  }

  return [...ids];
}

async function rewriteSet(key: string, members: string[]): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  try {
    await kv.del(key);
  } catch {
    /* ignore */
  }
  if (members.length === 0) return;
  const BATCH = 200;
  for (let i = 0; i < members.length; i += BATCH) {
    const chunk = members.slice(i, i + BATCH);
    const pipeline = kv.pipeline();
    for (const member of chunk) pipeline.sadd(key, member);
    await pipeline.exec();
  }
}

export async function reindexProspectStatuses(): Promise<{
  scanned: number;
  byStatus: Record<string, number>;
  indexSize: number;
  firmIndexes: number;
}> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');

  const ids = await collectProspectIds();
  const byStatus: Record<string, number> = {};
  for (const s of ALL_STATUSES) byStatus[s] = 0;

  const statusMembers: Record<string, string[]> = {};
  for (const s of ALL_STATUSES) statusMembers[s] = [];

  const firmMembers = new Map<string, string[]>();
  const validIds: string[] = [];

  for (const id of ids) {
    const p = await getProspect(id);
    if (!p) continue;
    validIds.push(id);
    const status = p.status;
    if (!statusMembers[status]) statusMembers[status] = [];
    statusMembers[status].push(id);
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    if (p.firmKey) {
      const firmKey = PROSPECT_FIRM_INDEX + p.firmKey;
      const list = firmMembers.get(firmKey) ?? [];
      list.push(id);
      firmMembers.set(firmKey, list);
    }
  }

  await rewriteSet(PROSPECT_INDEX, validIds);
  for (const status of ALL_STATUSES) {
    await rewriteSet(statusIndexKey(status), statusMembers[status] ?? []);
  }

  let firmIndexes = 0;
  for (const [key, members] of firmMembers) {
    await rewriteSet(key, members);
    firmIndexes++;
  }

  return {
    scanned: validIds.length,
    byStatus,
    indexSize: validIds.length,
    firmIndexes,
  };
}
