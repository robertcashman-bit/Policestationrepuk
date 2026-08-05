import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Tombstone: lead-magnet capture was removed (cfd97e8) because it only
 * spammed admin. Keep this route so residual clients / old mirrors get 410
 * instead of resurrecting Resend admin notifications.
 */
async function gone(request: Request) {
  console.warn('[lead-magnet] rejected — endpoint retired', {
    method: request.method,
    referer: request.headers.get('referer'),
  });
  return NextResponse.json(
    {
      ok: false,
      error: 'Lead magnet email capture has been retired.',
      code: 'lead_magnet_retired',
    },
    { status: 410 },
  );
}

export async function GET(request: Request) {
  return gone(request);
}

export async function POST(request: Request) {
  return gone(request);
}
