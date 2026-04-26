import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getRawReps, getRegisteredRepByEmail } from '@/lib/data';
import { getFeaturedStatus, isFeaturedActive } from '@/lib/featured';
import { createCheckout, getVariantId, PRICING, type PricingTier } from '@/lib/lemonsqueezy';
import type { Representative } from '@/lib/types';

async function findRep(email: string): Promise<Representative | null> {
  const reps = getRawReps();
  const staticRep = reps.find((r) => r.email.toLowerCase() === email);
  if (staticRep) return staticRep;
  return getRegisteredRepByEmail(email);
}

export async function POST(req: NextRequest) {
  const email = await getSession();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rep = await findRep(email);
  if (!rep) {
    return NextResponse.json({ error: 'No listing found for this email' }, { status: 404 });
  }

  const existing = await getFeaturedStatus(email);
  if (rep.featured || isFeaturedActive(existing)) {
    return NextResponse.json(
      { error: 'Your listing is already featured' },
      { status: 400 },
    );
  }

  let body: { tier?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const tier = (body.tier || 'monthly') as PricingTier;
  if (!PRICING[tier]) {
    return NextResponse.json({ error: 'Invalid pricing tier' }, { status: 400 });
  }

  const variantId = getVariantId(tier);
  if (!variantId) {
    return NextResponse.json(
      { error: 'Payment not configured for this tier' },
      { status: 500 },
    );
  }

  const baseUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://policestationrepuk.org';

  try {
    const checkout = await createCheckout({
      variantId,
      email: rep.email,
      name: rep.name,
      successUrl: `${baseUrl}/Account?featured=success`,
      customData: {
        repId: rep.id,
        userId: email.toLowerCase(),
        email: email.toLowerCase(),
        tier,
        repSlug: rep.slug,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error('[checkout] Failed to create checkout:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
