import { NextResponse } from 'next/server';
import { getAllStations } from '@/lib/data';

export async function GET() {
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
