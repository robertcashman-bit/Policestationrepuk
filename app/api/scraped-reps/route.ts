import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getAllReps, getDirectoryRepSource } from '@/lib/data';
import { repMatchesCountyName } from '@/lib/county-matching';
import type { Representative } from '@/lib/types';

export async function GET(request: Request) {
  try {
    let reps = await getAllReps();
    const repSource = getDirectoryRepSource();

    const url = new URL(request.url);
    const county = url.searchParams.get('county');
    const q = url.searchParams.get('q');
    const availability = url.searchParams.get('availability');

    if (county) {
      reps = reps.filter((r) => repMatchesCountyName(r.county, county));
    }
    if (q) {
      const query = q.toLowerCase();
      reps = reps.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(query) ||
          (r.county || '').toLowerCase().includes(query) ||
          (r.stations || []).some((s) => s.toLowerCase().includes(query)),
      );
    }
    if (availability) {
      const a = availability.toLowerCase();
      reps = reps.filter((r) => (r.availability || '').toLowerCase().includes(a));
    }

    const dir = path.join(process.cwd(), 'data');
    const scrapedPath = path.join(dir, 'scraped-reps.json');
    const fallbackPath = path.join(dir, 'reps.json');
    const stampPath = fs.existsSync(scrapedPath) ? scrapedPath : fallbackPath;
    const lastModified = fs.existsSync(stampPath) ? fs.statSync(stampPath).mtime.toISOString() : null;

    return NextResponse.json({
      total: reps.length,
      source: repSource === 'scraped' ? 'scraped-reps.json (primary, merged with reps.json gaps)' : 'reps.json (fallback)',
      repSource,
      lastModified,
      reps: reps as Representative[],
    });
  } catch (err) {
    console.error('[scraped-reps] Failed to load representatives:', err);
    return NextResponse.json(
      { error: 'Failed to load representatives' },
      { status: 500 },
    );
  }
}
