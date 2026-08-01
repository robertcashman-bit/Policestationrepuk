import { MAX_ENRICH_ATTEMPTS } from './enrich-candidates';
import { getProspect, listProspectIdsByStatus, saveProspect } from '../storage';

/** Move no_email prospects back to discovered so enrichment can retry them. */
export async function requeueNoEmailProspects(opts?: {
  maxAttempts?: number;
  dryRun?: boolean;
  campaignId?: string;
  /** Cap how many to requeue in one pass (avoid huge write storms). */
  limit?: number;
}): Promise<{ requeued: number; scanned: number }> {
  const maxAttempts = opts?.maxAttempts ?? MAX_ENRICH_ATTEMPTS;
  const limit = opts?.limit ?? Number.POSITIVE_INFINITY;
  let requeued = 0;
  let scanned = 0;

  for (const id of await listProspectIdsByStatus('no_email')) {
    const p = await getProspect(id);
    if (!p || p.status !== 'no_email') continue;
    scanned++;
    if (opts?.campaignId && p.campaignId !== opts.campaignId) continue;
    if (p.enrichAttempts >= maxAttempts) continue;

    if (!opts?.dryRun) {
      p.status = 'discovered';
      // Give enrichment another full pass after Sunday/manual requeue.
      p.enrichAttempts = 0;
      p.lastEnrichAttemptAt = undefined;
      p.updatedAt = new Date().toISOString();
      await saveProspect(p, 'no_email');
    }
    requeued++;
    if (requeued >= limit) break;
  }

  return { requeued, scanned };
}
