import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getKV } from '@/lib/kv';
import {
  getRawReps,
  getRegisteredRepByEmail,
  hideStaticListingEmail,
  invalidateProfileCache,
  invalidateRegisteredRepsCache,
} from '@/lib/data';
import { invalidateFeaturedCache } from '@/lib/featured';

async function findRep(email: string) {
  const reps = getRawReps();
  const staticRep = reps.find((r) => r.email.toLowerCase() === email);
  if (staticRep) return staticRep;
  return getRegisteredRepByEmail(email);
}

export async function DELETE() {
  const email = await getSession();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const kv = getKV();
  if (!kv) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
  }

  const rep = await findRep(email);
  if (!rep) {
    return NextResponse.json({ error: 'No listing found for this email' }, { status: 404 });
  }

  const lower = email.toLowerCase();
  const isRegisteredOnly = rep.id.startsWith('newrep:');

  try {
    if (isRegisteredOnly) {
      await kv.del(`newrep:${lower}`);
      await kv.del(`profile:${lower}`);
      await kv.del(`featured:${lower}`);
      invalidateRegisteredRepsCache();
    } else {
      await hideStaticListingEmail(lower);
      await kv.del(`profile:${lower}`);
      await kv.del(`featured:${lower}`);
    }

    invalidateProfileCache();
    invalidateFeaturedCache();
  } catch (err) {
    console.error('[listing DELETE]', err);
    return NextResponse.json({ error: 'Could not remove listing. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    removedRegistration: isRegisteredOnly,
    hiddenStaticEntry: !isRegisteredOnly,
  });
}
