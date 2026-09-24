import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { robertDirectMobilePayload } from '@/lib/robert-direct-mobile';
import { verifyTurnstile } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';

/**
 * Solicitor/agency direct-mobile reveal for Robert Cashman only.
 *
 * Digits are intentionally absent from the profile SSR/RSC payload.
 * Requires a verified Cloudflare Turnstile token (POST body) and is
 * rate-limited to 5 requests per IP per hour.
 */
export async function GET() {
  // Never return the number over GET — callers must POST a Turnstile token.
  return NextResponse.json(
    { error: 'Method not allowed. POST a Turnstile token to reveal.' },
    { status: 405 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (slug !== 'robert-cashman') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ip = getClientIp(request);

  const limit = await rateLimitOk({
    ip,
    scope: 'robert-direct-mobile-reveal',
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  let body: { turnstileToken?: unknown } = {};
  try {
    body = (await request.json()) as { turnstileToken?: unknown };
  } catch {
    return NextResponse.json(
      { error: 'Turnstile token required.' },
      { status: 403 },
    );
  }

  const token = typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : '';
  if (!token) {
    return NextResponse.json(
      { error: 'Turnstile token required.' },
      { status: 403 },
    );
  }

  const ts = await verifyTurnstile(token, ip);
  if (!ts.ok) {
    return NextResponse.json(
      { error: ts.message || 'Turnstile verification failed.', code: ts.code },
      { status: 403 },
    );
  }

  return NextResponse.json(robertDirectMobilePayload());
}
