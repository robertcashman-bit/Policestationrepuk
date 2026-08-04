import { NextResponse } from 'next/server';
import { applyUnsubscribeToken } from '@/lib/firm-outreach/outreach/apply-unsubscribe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function tokenFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('token')?.trim();
  if (fromQuery) return fromQuery;
  // Some one-click clients POST the token in the body as form data.
  return null;
}

async function tokenFromPost(request: Request): Promise<string | null> {
  const fromQuery = tokenFromRequest(request);
  if (fromQuery) return fromQuery;
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      const t = form.get('token');
      return typeof t === 'string' && t.trim() ? t.trim() : null;
    }
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { token?: unknown };
      return typeof body.token === 'string' && body.token.trim() ? body.token.trim() : null;
    }
  } catch {
    /* ignore body parse errors */
  }
  return null;
}

/**
 * Canonical List-Unsubscribe / one-click endpoint.
 * GET: apply suppression (browser-friendly JSON).
 * POST: RFC 8058 one-click — apply suppression and return 200 (no redirect).
 */
export async function GET(request: Request) {
  const result = await applyUnsubscribeToken(tokenFromRequest(request));
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        hint: 'Use /api/unsubscribe?token=<signed-token> or /outreach/unsubscribe/<token>',
      },
      { status: result.error === 'missing_token' ? 400 : 400 },
    );
  }
  return NextResponse.json({
    ok: true,
    email: result.email,
    prospectsUpdated: result.prospectsUpdated,
    message: 'You are unsubscribed from firm outreach emails.',
  });
}

/** RFC 8058 one-click unsubscribe — must return 2xx without requiring a redirect follow. */
export async function POST(request: Request) {
  const token = await tokenFromPost(request);
  const result = await applyUnsubscribeToken(token);
  if (!result.ok) {
    return new NextResponse(null, { status: 400 });
  }
  // Empty 200 body is the usual one-click success response.
  return new NextResponse(null, { status: 200 });
}
