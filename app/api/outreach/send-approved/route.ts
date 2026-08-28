import { NextResponse } from 'next/server';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/** Click-to-send approval endpoint permanently disabled. */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      reason: FIRM_OUTREACH_EMAIL_DISABLED_REASON,
      error: 'Firm outreach send-approved is permanently disabled',
    },
    { status: 410 },
  );
}
