import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getKV } from '@/lib/kv';
import { getRawReps } from '@/lib/data';
import { sendProfileUpdateNotification } from '@/lib/email';

const ALLOWED_FIELDS = new Set([
  'name',
  'phone',
  'availability',
  'accreditation',
  'stations_covered',
  'notes',
  'postcode',
  'website_url',
  'whatsapp_link',
  'dscc_pin',
  'holiday_availability',
  'languages',
  'specialisms',
  'years_experience',
]);

export async function GET() {
  const email = await getSession();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const reps = getRawReps();
  const rep = reps.find((r) => r.email.toLowerCase() === email);
  if (!rep) {
    return NextResponse.json({ error: 'No listing found for this email' }, { status: 404 });
  }

  const kv = getKV();
  const overrides: Record<string, unknown> = kv
    ? (await kv.get<Record<string, unknown>>(`profile:${email}`)) ?? {}
    : {};

  const merged = {
    slug: rep.slug,
    name: (overrides.name as string | undefined) ?? rep.name,
    email: rep.email,
    phone: (overrides.phone as string | undefined) ?? rep.phone,
    accreditation: (overrides.accreditation as string | undefined) ?? rep.accreditation,
    availability: (overrides.availability as string | undefined) ?? rep.availability,
    postcode: (overrides.postcode as string | undefined) ?? rep.postcode ?? '',
    stations_covered: (overrides.stations_covered as string[] | undefined) ?? rep.stationsCovered ?? rep.stations ?? [],
    notes: (overrides.notes as string | undefined) ?? rep.notes ?? rep.bio ?? '',
    website_url: (overrides.website_url as string | undefined) ?? rep.websiteUrl ?? '',
    whatsapp_link: (overrides.whatsapp_link as string | undefined) ?? rep.whatsappLink ?? '',
    dscc_pin: (overrides.dscc_pin as string | undefined) ?? rep.dsccPin ?? '',
    holiday_availability: (overrides.holiday_availability as string[] | undefined) ?? rep.holidayAvailability ?? [],
    languages: (overrides.languages as string[] | undefined) ?? rep.languages ?? [],
    specialisms: (overrides.specialisms as string[] | undefined) ?? rep.specialisms ?? [],
    years_experience: (overrides.years_experience as number | undefined) ?? rep.yearsExperience ?? null,
    updated_at: (overrides.updated_at as string | undefined) ?? null,
  };

  return NextResponse.json(merged);
}

export async function PUT(request: Request) {
  const email = await getSession();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const kv = getKV();
  if (!kv) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
  }

  const reps = getRawReps();
  const rep = reps.find((r) => r.email.toLowerCase() === email);
  if (!rep) {
    return NextResponse.json({ error: 'No listing found for this email' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      update[key] = body[key];
    }
  }

  for (const [key, val] of Object.entries(update)) {
    if (typeof val === 'string' && val.length > 5000) {
      return NextResponse.json({ error: `${key} is too long` }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  const existing = (await kv.get<Record<string, unknown>>(`profile:${email}`)) ?? {};
  const merged = { ...existing, ...update, updated_at: now, email, rep_slug: rep.slug };
  await kv.set(`profile:${email}`, merged);

  const changes: Record<string, { from: string; to: string }> = {};
  for (const key of ALLOWED_FIELDS) {
    const newVal = body[key];
    if (newVal === undefined) continue;
    const oldVal = getOldValue(rep, key);
    const newStr = Array.isArray(newVal) ? newVal.join(', ') : String(newVal ?? '');
    const oldStr = Array.isArray(oldVal) ? oldVal.join(', ') : String(oldVal ?? '');
    if (newStr !== oldStr) {
      changes[key] = { from: oldStr, to: newStr };
    }
  }

  if (Object.keys(changes).length > 0) {
    sendProfileUpdateNotification({
      repName: (body.name as string) || rep.name,
      repEmail: email,
      repSlug: rep.slug,
      changes,
    }).catch((err) => console.error('[profile notify]', err));
  }

  return NextResponse.json({ ok: true, updated_at: now });
}

function getOldValue(
  rep: ReturnType<typeof getRawReps>[number],
  key: string,
): unknown {
  const map: Record<string, unknown> = {
    name: rep.name,
    phone: rep.phone,
    availability: rep.availability,
    accreditation: rep.accreditation,
    stations_covered: rep.stationsCovered ?? rep.stations,
    notes: rep.notes ?? rep.bio,
    postcode: rep.postcode,
    website_url: rep.websiteUrl,
    whatsapp_link: rep.whatsappLink,
    dscc_pin: rep.dsccPin,
    holiday_availability: rep.holidayAvailability,
    languages: rep.languages,
    specialisms: rep.specialisms,
    years_experience: rep.yearsExperience,
  };
  return map[key] ?? '';
}
