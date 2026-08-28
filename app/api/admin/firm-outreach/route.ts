import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Firm outreach admin API permanently disabled (email product removed). */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      reason: FIRM_OUTREACH_EMAIL_DISABLED_REASON,
      error: 'Firm outreach email admin API is permanently disabled',
    },
    { status: 410 },
  );
}

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      reason: FIRM_OUTREACH_EMAIL_DISABLED_REASON,
      error: 'Firm outreach email admin API is permanently disabled',
    },
    { status: 410 },
  );
}
