import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Tombstone: lead-magnet capture was removed (cfd97e8) because it only
 * spammed admin. Keep this route so residual clients / old mirrors get 410
 * instead of resurrecting Resend admin notifications.
 */
async function gone(request: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7496/ingest/55a0b704-8cf7-4e35-a08f-f5d81d38bd00', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '71f13e' },
    body: JSON.stringify({
      sessionId: '71f13e',
      runId: 'lead-magnet-tombstone',
      hypothesisId: 'A',
      location: 'app/api/lead-magnet/route.ts',
      message: 'lead-magnet hit after removal',
      data: {
        method: request.method,
        path: '/api/lead-magnet',
        ua: request.headers.get('user-agent')?.slice(0, 120) ?? null,
        referer: request.headers.get('referer')?.slice(0, 200) ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
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
