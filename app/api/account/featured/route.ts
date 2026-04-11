import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getRawReps, getRegisteredRepByEmail } from '@/lib/data';
import type { Representative } from '@/lib/types';
import {
  getFeaturedStatus,
  activateFeatured,
  markEmailsSent,
} from '@/lib/featured';
import {
  sendFeaturedConfirmationToRep,
  sendFeaturedOwnerNotification,
} from '@/lib/email';

async function findRep(email: string): Promise<Representative | null> {
  const reps = getRawReps();
  const staticRep = reps.find((r) => r.email.toLowerCase() === email);
  if (staticRep) return staticRep;
  return getRegisteredRepByEmail(email);
}

export async function GET() {
  const email = await getSession();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rep = await findRep(email);
  if (!rep) {
    return NextResponse.json({ error: 'No listing found' }, { status: 404 });
  }

  const alreadyFeaturedInStatic = rep.featured === true;
  const kvMeta = await getFeaturedStatus(email);

  return NextResponse.json({
    featured: alreadyFeaturedInStatic || kvMeta !== null,
    activatedAt: kvMeta?.activatedAt ?? null,
    source: alreadyFeaturedInStatic ? 'static' : kvMeta ? 'upgraded' : null,
  });
}

export async function POST() {
  const email = await getSession();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rep = await findRep(email);
  if (!rep) {
    return NextResponse.json({ error: 'No listing found for this email' }, { status: 404 });
  }

  const existing = await getFeaturedStatus(email);
  if (rep.featured && !existing) {
    return NextResponse.json({
      ok: true,
      alreadyFeatured: true,
      message: 'Your listing is already featured.',
    });
  }
  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadyFeatured: true,
      activatedAt: existing.activatedAt,
      message: 'Your listing is already featured.',
    });
  }

  const meta = await activateFeatured(email);

  const [repEmailSent, ownerEmailSent] = await Promise.all([
    sendFeaturedConfirmationToRep({
      name: rep.name,
      email: rep.email,
      activatedAt: meta.activatedAt,
    }).catch((err) => {
      console.error('[featured] Rep email failed:', err);
      return false;
    }),
    sendFeaturedOwnerNotification({
      name: rep.name,
      email: rep.email,
      repSlug: rep.slug,
      activatedAt: meta.activatedAt,
    }).catch((err) => {
      console.error('[featured] Owner email failed:', err);
      return false;
    }),
  ]);

  await markEmailsSent(email, {
    rep: repEmailSent,
    owner: ownerEmailSent,
  }).catch((err) => console.warn('[featured] markEmailsSent failed:', err));

  return NextResponse.json({
    ok: true,
    alreadyFeatured: false,
    activatedAt: meta.activatedAt,
    message: 'Your listing has been upgraded to Featured!',
  });
}
