/**
 * Rebuild prospect status indexes after a saveProspect indexing bug.
 * npx tsx scripts/firm-outreach-reindex.ts
 */
import { getKV } from '@/lib/kv';
import type { FirmProspectStatus } from './types';
import { getProspectsByIds, listAllProspectIds } from './storage';

const PROSPECT_STATUS_INDEX = 'firmprospect:status:';

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

  for (const id of ids) {
    const p = prospects.get(id);
    if (!p) continue;
    if (!buckets[p.status]) {
      buckets[p.status] = [];
      byStatus[p.status] = 0;
    }
    buckets[p.status].push(id);
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  // One write per status (plus clears for empty statuses) instead of get/set per prospect.
  const pipeline = kv.pipeline();
  for (const s of ALL_STATUSES) {
    pipeline.set(statusIndexKey(s), buckets[s] ?? []);
  }
  for (const s of Object.keys(buckets)) {
    if (!ALL_STATUSES.includes(s as FirmProspectStatus)) {
      pipeline.set(statusIndexKey(s as FirmProspectStatus), buckets[s] ?? []);
    }
  }
  await pipeline.exec();

  return { scanned: ids.length, byStatus };
}
