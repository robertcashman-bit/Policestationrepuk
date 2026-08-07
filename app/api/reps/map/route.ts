import { NextResponse } from 'next/server';
import { getAllReps, getAllCounties } from '@/lib/data';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';

export const dynamic = 'force-dynamic';

/** Rep counts by county for map / coverage widgets. */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimitOk({
    ip,
    scope: 'public-reps-map',
    max: 60,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  const [reps, counties] = await Promise.all([getAllReps(), getAllCounties()]);
  const counts = new Map<string, number>();

  for (const rep of reps) {
    const keys = new Set<string>();
    if (rep.county) keys.add(rep.county.toLowerCase());
    for (const c of rep.counties ?? []) {
      if (c) keys.add(c.toLowerCase());
    }
    for (const key of keys) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const byCounty = counties
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      repCount: counts.get(c.name.toLowerCase()) ?? counts.get(c.slug.toLowerCase()) ?? 0,
    }))
    .filter((c) => c.repCount > 0)
    .sort((a, b) => b.repCount - a.repCount);

  return NextResponse.json({
    totalReps: reps.length,
    countiesWithReps: byCounty.length,
    byCounty,
  });
}
