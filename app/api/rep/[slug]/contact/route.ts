import { NextResponse } from 'next/server';
import { getRepBySlug, stripPrivateFields } from '@/lib/data';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { publicDirectoryPhone } from '@/lib/operator-public-phones';

export const dynamic = 'force-dynamic';

/**
 * Explicit contact reveal for directory / homepage cards.
 * Contact details are omitted from RSC client props; this endpoint is the only
 * public source after the user clicks "Show Contact Details" / "Quick contact".
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const ip = getClientIp(request);
  const limit = await rateLimitOk({
    ip,
    scope: 'rep-contact-reveal',
    max: 30,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  const { slug } = await context.params;
  const found = await getRepBySlug(slug);
  if (!found) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rep = stripPrivateFields(found);
  const phone = publicDirectoryPhone(rep.phone) || '';

  return NextResponse.json({
    slug: rep.slug,
    phone,
    email: rep.email || '',
    whatsappLink: rep.whatsappLink || '',
  });
}
