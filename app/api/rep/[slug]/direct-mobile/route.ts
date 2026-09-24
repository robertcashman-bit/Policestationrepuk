import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { robertDirectMobilePayload } from '@/lib/robert-direct-mobile';

export const dynamic = 'force-dynamic';

/**
 * Solicitor/agency direct-mobile reveal for Robert Cashman only.
 * Digits are intentionally absent from the profile SSR/RSC payload.
 */
export async function GET(
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
    max: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  return NextResponse.json(robertDirectMobilePayload());
}
