import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllReps } from '@/lib/data';
import { sendProfileUpdateNotification } from '@/lib/email';

interface ProfileRow {
  name?: string | null;
  phone?: string | null;
  availability?: string | null;
  accreditation?: string | null;
  stations_covered?: string[] | null;
  notes?: string | null;
  postcode?: string | null;
  website_url?: string | null;
  whatsapp_link?: string | null;
  dscc_pin?: string | null;
  holiday_availability?: string[] | null;
  languages?: string[] | null;
  specialisms?: string[] | null;
  years_experience?: number | null;
  updated_at?: string | null;
}

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const email = user.email.toLowerCase();
  const reps = await getAllReps();
  const rep = reps.find((r) => r.email.toLowerCase() === email);

  if (!rep) {
    return NextResponse.json({ error: 'No listing found for this email' }, { status: 404 });
  }

  // Load any self-service overrides from Supabase
  const { data: overrides } = await supabase
    .from('rep_profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  const merged = {
    slug: rep.slug,
    name: overrides?.name ?? rep.name,
    email: rep.email,
    phone: overrides?.phone ?? rep.phone,
    accreditation: overrides?.accreditation ?? rep.accreditation,
    availability: overrides?.availability ?? rep.availability,
    postcode: overrides?.postcode ?? rep.postcode ?? '',
    stations_covered: overrides?.stations_covered ?? rep.stationsCovered ?? rep.stations ?? [],
    notes: overrides?.notes ?? rep.notes ?? rep.bio ?? '',
    website_url: overrides?.website_url ?? rep.websiteUrl ?? '',
    whatsapp_link: overrides?.whatsapp_link ?? rep.whatsappLink ?? '',
    dscc_pin: overrides?.dscc_pin ?? rep.dsccPin ?? '',
    holiday_availability: overrides?.holiday_availability ?? rep.holidayAvailability ?? [],
    languages: overrides?.languages ?? rep.languages ?? [],
    specialisms: overrides?.specialisms ?? rep.specialisms ?? [],
    years_experience: overrides?.years_experience ?? rep.yearsExperience ?? null,
    updated_at: overrides?.updated_at ?? null,
  };

  return NextResponse.json(merged);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const email = user.email.toLowerCase();
  const reps = await getAllReps();
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

  // Whitelist fields
  const update: Record<string, unknown> = { email, rep_slug: rep.slug };
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      update[key] = body[key];
    }
  }

  // Validate string lengths
  for (const [key, val] of Object.entries(update)) {
    if (typeof val === 'string' && val.length > 5000) {
      return NextResponse.json({ error: `${key} is too long` }, { status: 400 });
    }
  }

  const { error: upsertError } = await supabase
    .from('rep_profiles')
    .upsert(update, { onConflict: 'email' });

  if (upsertError) {
    console.error('[profile upsert]', upsertError);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }

  // Build a summary of what changed for the admin notification
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

  return NextResponse.json({ ok: true, updated_at: new Date().toISOString() });
}

function getOldValue(
  rep: Awaited<ReturnType<typeof getAllReps>>[number],
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
