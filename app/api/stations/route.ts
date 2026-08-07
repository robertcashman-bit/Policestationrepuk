import { NextResponse } from 'next/server';
import { getAllStations } from '@/lib/data';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimitOk({
    ip,
    scope: 'public-stations',
    max: 60,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  const stations = await getAllStations();
  const pins = stations.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    county: s.county || s.forceName || 'Unknown',
    address: s.address,
    phone: s.custodyPhone || s.phone || '',
    custodySuite: s.isCustodyStation || false,
    lat: s.latitude ?? null,
    lng: s.longitude ?? null,
  }));
  return NextResponse.json(pins);
}
