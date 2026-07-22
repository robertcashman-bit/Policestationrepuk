import { getKV } from '@/lib/kv';
import type { ResearchCandidate, StationResearchRunReport } from './types';

const CANDIDATE_PREFIX = 'stationresearch:candidate:';
const CANDIDATE_INDEX = 'stationresearch:candidate:index';
const RUN_PREFIX = 'stationresearch:run:';
const LATEST_RUN = 'stationresearch:run:latest';
const MGET_CHUNK = 100;

function candidateKey(id: string): string {
  return `${CANDIDATE_PREFIX}${id}`;
}

export async function saveResearchCandidate(candidate: ResearchCandidate): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(candidateKey(candidate.id), candidate);
  await kv.sadd(CANDIDATE_INDEX, candidate.id);
}

export async function getResearchCandidate(id: string): Promise<ResearchCandidate | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<ResearchCandidate>(candidateKey(id))) ?? null;
}

export async function listOpenResearchCandidates(limit = 100): Promise<ResearchCandidate[]> {
  const kv = getKV();
  if (!kv) return [];
  const ids = (await kv.smembers(CANDIDATE_INDEX)) as string[];
  if (ids.length === 0) return [];

  // Cap how many keys we fetch: open candidates are a subset; over-fetch then filter.
  const fetchIds = ids.slice(0, Math.max(limit * 3, limit));
  const out: ResearchCandidate[] = [];

  for (let i = 0; i < fetchIds.length; i += MGET_CHUNK) {
    const chunk = fetchIds.slice(i, i + MGET_CHUNK);
    const values = await kv.mget<(ResearchCandidate | null)[]>(
      ...chunk.map((id) => candidateKey(id)),
    );
    for (const c of values) {
      if (c && c.status === 'open') out.push(c);
      if (out.length >= limit) {
        return out.sort((a, b) => b.confidenceScore - a.confidenceScore);
      }
    }
  }

  return out.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export async function updateResearchCandidateStatus(
  id: string,
  status: ResearchCandidate['status'],
  actor: string,
): Promise<ResearchCandidate | null> {
  const existing = await getResearchCandidate(id);
  if (!existing) return null;
  const updated: ResearchCandidate = {
    ...existing,
    status,
    decisionReasons: [...existing.decisionReasons, `status:${status}:by:${actor}`],
  };
  await saveResearchCandidate(updated);
  return updated;
}

export async function saveResearchRunReport(report: StationResearchRunReport): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${RUN_PREFIX}${report.runId}`, report, { ex: 60 * 60 * 24 * 90 });
  await kv.set(LATEST_RUN, report, { ex: 60 * 60 * 24 * 90 });
}

export async function getLatestResearchRunReport(): Promise<StationResearchRunReport | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<StationResearchRunReport>(LATEST_RUN)) ?? null;
}
