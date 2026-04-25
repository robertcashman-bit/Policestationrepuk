import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getRawReps, getRegisteredRepByEmail } from '@/lib/data';
import type { Representative } from '@/lib/types';
import {
  getFeaturedStatus,
  isFeaturedActive,
} from '@/lib/featured';

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
  const isActive = alreadyFeaturedInStatic || isFeaturedActive(kvMeta);

  return NextResponse.json({
    featured: isActive,
    activatedAt: kvMeta?.activatedAt ?? null,
    source: alreadyFeaturedInStatic ? 'static' : kvMeta ? 'upgraded' : null,
    status: alreadyFeaturedInStatic ? 'grandfathered' : kvMeta?.status ?? null,
    expiresAt: kvMeta?.expiresAt ?? null,
    renewsAt: kvMeta?.renewsAt ?? null,
    tier: kvMeta?.tier ?? null,
  });
}

export async function POST() {
  return NextResponse.json(
    { error: 'Use /api/checkout/featured to subscribe to featured listing' },
    { status: 400 },
  );
}
