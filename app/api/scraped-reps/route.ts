import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request) {
  const scrapedPath = path.join(process.cwd(), 'data', 'scraped-reps.json');
  const fallbackPath = path.join(process.cwd(), 'data', 'reps.json');

  const filePath = fs.existsSync(scrapedPath) ? scrapedPath : fallbackPath;

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'No data available' }, { status: 404 });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const reps = JSON.parse(raw);

    const url = new URL(request.url);
    const county = url.searchParams.get('county');
    const q = url.searchParams.get('q');
    const availability = url.searchParams.get('availability');

    let filtered = Array.isArray(reps) ? reps : [];

    if (county) {
      filtered = filtered.filter(
        (r: Record<string, string>) => (r.county || '').toLowerCase() === county.toLowerCase()
      );
    }
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(
        (r: Record<string, unknown>) =>
          ((r.name as string) || '').toLowerCase().includes(query) ||
          ((r.county as string) || '').toLowerCase().includes(query) ||
          ((r.stations as string[]) || []).some((s: string) => s.toLowerCase().includes(query))
      );
    }
    if (availability) {
      filtered = filtered.filter(
        (r: Record<string, string>) =>
          (r.availability || '').toLowerCase().includes(availability.toLowerCase())
      );
    }

    return NextResponse.json({
      total: filtered.length,
      source: fs.existsSync(scrapedPath) ? 'scraped-reps.json' : 'reps.json',
      lastModified: fs.statSync(filePath).mtime.toISOString(),
      reps: filtered,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to read data', details: (err as Error).message },
      { status: 500 }
    );
  }
}
