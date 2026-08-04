import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Canonical API entry for List-Unsubscribe / one-click clients.
 * Redirects to the signed-token page that applies suppression.
 *
 * Prefer /outreach/unsubscribe/<token> in message bodies; this route exists so
 * /api/unsubscribe?token=… also works.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: 'missing_token',
        hint: 'Use /outreach/unsubscribe/<signed-token> or ?token=',
      },
      { status: 400 },
    );
  }
  const dest = new URL(
    `/outreach/unsubscribe/${encodeURIComponent(token)}`,
    url.origin,
  );
  return NextResponse.redirect(dest, 302);
}

/** RFC 8058 one-click unsubscribe (POST). */
export async function POST(request: Request) {
  return GET(request);
}
