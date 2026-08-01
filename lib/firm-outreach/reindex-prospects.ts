/**
 * Rebuild prospect status indexes after a saveProspect indexing bug.
 * Writes Redis SETs (SADD) so indexes match production SET-based keys.
 * npx tsx scripts/firm-outreach-reindex.ts
 */
import { getKV } from '@/lib/kv';
import type { FirmProspectStatus } from './types';
import { getProspectsByIds, listAllProspectIds, replaceSetIndex } from './storage';

const PROSPECT_STATUS_INDEX = 'firmprospect:status:';
const PROSPECT_INDEX = 'firmprospect:index';
const PROSPECT_FIRM_INDEX = 'firmprospect:firm:';

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

export async function reindexProspectStatuses(): Promise<{
  scanned: number;
  byStatus: Record<string, number>;
  firmKeys: number;
}> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');

  const byStatus: Record<string, number> = {};
  const buckets: Record<string, string[]> = {};
  for (const s of ALL_STATUSES) {
    byStatus[s] = 0;
    buckets[s] = [];
  }

  const ids = await listAllProspectIds();
  const prospects = await getProspectsByIds(ids);
  const validIds: string[] = [];
  const firmBuckets = new Map<string, string[]>();

  for (const id of ids) {
    const p = prospects.get(id);
    if (!p) continue;
    validIds.push(id);
    if (!buckets[p.status]) {
      buckets[p.status] = [];
      byStatus[p.status] = 0;
    }
    buckets[p.status]!.push(id);
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    const firmList = firmBuckets.get(p.firmKey) ?? [];
    firmList.push(id);
    firmBuckets.set(p.firmKey, firmList);
  }

  // Rebuild global prospect index + per-status indexes as SETs.
  await replaceSetIndex(PROSPECT_INDEX, validIds);
  for (const s of ALL_STATUSES) {
    await replaceSetIndex(statusIndexKey(s), buckets[s] ?? []);
  }
  for (const s of Object.keys(buckets)) {
    if (!ALL_STATUSES.includes(s as FirmProspectStatus)) {
      await replaceSetIndex(statusIndexKey(s as FirmProspectStatus), buckets[s] ?? []);
    }
  }

  // Rebuild firm-key indexes (best-effort; keys not listed elsewhere).
  for (const [firmKey, firmIds] of firmBuckets) {
    await replaceSetIndex(PROSPECT_FIRM_INDEX + firmKey, firmIds);
  }

  return { scanned: validIds.length, byStatus, firmKeys: firmBuckets.size };
}
