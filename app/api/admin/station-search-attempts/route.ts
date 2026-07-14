import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listSearchAttemptsForStation } from '@/lib/custody-discovery/search-attempts';
import { clusterSharedNumbers } from '@/lib/custody-discovery/number-ownership';
import { getAllFindings, getFindingsForSuite } from '@/lib/custody-discovery/storage';

export const dynamic = 'force-dynamic';

/**
 * Admin: search attempt history + candidate/number-ownership context for a station.
 * Query: ?stationId=...
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const stationId = new URL(request.url).searchParams.get('stationId')?.trim();
  if (!stationId) {
    return NextResponse.json({ error: 'stationId required' }, { status: 400 });
  }

  const [attempts, findings, allFindings] = await Promise.all([
    listSearchAttemptsForStation(stationId, 60),
    getFindingsForSuite(stationId),
    getAllFindings(),
  ]);

  const shared = clusterSharedNumbers(allFindings, 3).filter((c) =>
    findings.some((f) => f.normalizedPhoneNumber === c.normalizedPhoneNumber),
  );

  return NextResponse.json({
    ok: true,
    stationId,
    attempts,
    findings: findings.map((f) => ({
      id: f.id,
      phone: f.possiblePhoneNumber,
      classification: f.classification,
      confidenceScore: f.confidenceScore,
      status: f.status,
      sourceUrl: f.sourceUrl,
      evidence: f.pageSnippet,
      aiRecommendation: f.aiReview?.recommendation,
      conflictReason: f.conflictReason,
    })),
    sharedNumberClusters: shared.slice(0, 20),
  });
}
