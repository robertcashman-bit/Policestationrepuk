import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getLatestResearchRunReport,
  listOpenResearchCandidates,
  updateResearchCandidateStatus,
} from '@/lib/station-research';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** List open station-research candidates + latest dry-run report. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [candidates, latestRun] = await Promise.all([
    listOpenResearchCandidates(100),
    getLatestResearchRunReport(),
  ]);

  return NextResponse.json({
    ok: true,
    openCount: candidates.length,
    candidates,
    latestRun,
  });
}

/** Approve / reject a research candidate (does not auto-write stations.json). */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    candidateId?: string;
    action?: 'approve' | 'reject';
  };
  if (!body.candidateId || (body.action !== 'approve' && body.action !== 'reject')) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const status = body.action === 'approve' ? 'approved' : 'rejected';
  const actor = auth.email || 'admin';
  const updated = await updateResearchCandidateStatus(body.candidateId, status, actor);
  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    candidate: updated,
    note:
      status === 'approved'
        ? 'Marked approved. Apply via existing station-contacts / UpdateStation publish path — research does not write stations.json directly.'
        : 'Candidate rejected.',
  });
}
