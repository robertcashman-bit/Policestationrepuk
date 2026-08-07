import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { mintLogoUploadToken } from '@/lib/legal-directory/logo-upload-token';

export const runtime = 'nodejs';

/**
 * Mint a short-lived, one-shot token required to upload a firm logo.
 * Rate-limited to stop anonymous mass-minting.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimitOk({
    ip,
    scope: 'legal-directory-logo-token',
    max: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many upload requests. Please try again later.' },
      { status: 429 },
    );
  }

  // Optional honeypot — bots that POST JSON with _hp filled get a fake success.
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = (await request.json()) as { _hp?: string };
      if (typeof body._hp === 'string' && body._hp.trim() !== '') {
        return NextResponse.json({ ok: true, token: 'ok' });
      }
    }
  } catch {
    /* empty / non-JSON body is fine */
  }

  const token = await mintLogoUploadToken();
  if (!token) {
    return NextResponse.json(
      { error: 'Logo uploads are temporarily unavailable.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, token });
}
