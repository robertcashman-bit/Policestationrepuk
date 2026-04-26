import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getRawReps } from '@/lib/data';
import { grandfatherExistingFeaturedReps, listFeaturedDebug } from '@/lib/featured';

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || process.env.OWNER_EMAIL || '')
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

async function requireAdmin() {
  const email = await getSession();
  if (!email) return { ok: false as const, status: 401, error: 'Not authenticated' };
  if (ADMIN_EMAILS.size > 0 && !ADMIN_EMAILS.has(email.toLowerCase())) {
    return { ok: false as const, status: 403, error: 'Not authorised' };
  }
  return { ok: true as const, email };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({ featured: await listFeaturedDebug() });
}

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const migrated = await grandfatherExistingFeaturedReps(getRawReps());
  return NextResponse.json({ ok: true, migrated });
}
