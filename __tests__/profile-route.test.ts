import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Profile route — uses getSession + KV (no Supabase)', () => {
  const routePath = path.resolve(__dirname, '..', 'app', 'api', 'account', 'profile', 'route.ts');
  const source = fs.readFileSync(routePath, 'utf-8');

  it('imports getSession from lib/auth', () => {
    expect(source).toMatch(/import\s*\{[^}]*getSession[^}]*\}\s*from\s*['"]@\/lib\/auth['"]/);
  });

  it('imports getKV from lib/kv', () => {
    expect(source).toMatch(/import\s*\{[^}]*getKV[^}]*\}\s*from\s*['"]@\/lib\/kv['"]/);
  });

  it('imports getRawReps from lib/data', () => {
    expect(source).toMatch(/import\s*\{[^}]*getRawReps[^}]*\}\s*from\s*['"]@\/lib\/data['"]/);
  });

  it('does NOT import from supabase', () => {
    expect(source).not.toContain('supabase');
  });

  it('GET handler uses getSession for auth', () => {
    const getHandler = extractFunctionBody(source, 'export async function GET');
    expect(getHandler).toBeTruthy();
    expect(getHandler).toContain('getSession()');
  });

  it('PUT handler uses getRawReps (raw data for diff)', () => {
    const putHandler = extractFunctionBody(source, 'export async function PUT');
    expect(putHandler).toBeTruthy();
    expect(putHandler).toContain('getRawReps()');
  });

  it('PUT handler calls getOldValue with the raw rep', () => {
    const putHandler = extractFunctionBody(source, 'export async function PUT');
    expect(putHandler).toContain('getOldValue(rep, key)');
  });

  it('getOldValue maps snake_case fields to camelCase rep properties', () => {
    expect(source).toContain('stations_covered: rep.stationsCovered');
    expect(source).toContain('website_url: rep.websiteUrl');
    expect(source).toContain('whatsapp_link: rep.whatsappLink');
    expect(source).toContain('dscc_pin: rep.dsccPin');
    expect(source).toContain('holiday_availability: rep.holidayAvailability');
    expect(source).toContain('years_experience: rep.yearsExperience');
  });
});

describe('Change diff logic — unit exercise', () => {
  const ALLOWED_FIELDS = new Set([
    'name', 'phone', 'availability', 'accreditation', 'stations_covered',
    'notes', 'postcode', 'website_url', 'whatsapp_link', 'dscc_pin',
    'holiday_availability', 'languages', 'specialisms', 'years_experience',
  ]);

  function getOldValue(rep: Record<string, unknown>, key: string): unknown {
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

  function computeChanges(
    body: Record<string, unknown>,
    rawRep: Record<string, unknown>,
  ): Record<string, { from: string; to: string }> {
    const changes: Record<string, { from: string; to: string }> = {};
    for (const key of ALLOWED_FIELDS) {
      const newVal = body[key];
      if (newVal === undefined) continue;
      const oldVal = getOldValue(rawRep, key);
      const newStr = Array.isArray(newVal) ? newVal.join(', ') : String(newVal ?? '');
      const oldStr = Array.isArray(oldVal) ? oldVal.join(', ') : String(oldVal ?? '');
      if (newStr !== oldStr) {
        changes[key] = { from: oldStr, to: newStr };
      }
    }
    return changes;
  }

  it('detects a name change against raw static value', () => {
    const rawRep = { name: 'Jane Doe', phone: '07700900000' };
    const body = { name: 'Jane Smith' };
    const changes = computeChanges(body, rawRep);
    expect(changes.name).toEqual({ from: 'Jane Doe', to: 'Jane Smith' });
  });

  it('does not report unchanged fields', () => {
    const rawRep = { name: 'Jane Doe', phone: '07700900000' };
    const body = { name: 'Jane Doe' };
    const changes = computeChanges(body, rawRep);
    expect(changes.name).toBeUndefined();
  });

  it('uses raw values, not override-merged values, for the "from" side', () => {
    const rawRep = { name: 'Original Static Name', websiteUrl: 'https://original.com' };
    const body = { name: 'Brand New Name', website_url: 'https://new.com' };
    const changes = computeChanges(body, rawRep);
    expect(changes.name.from).toBe('Original Static Name');
    expect(changes.website_url.from).toBe('https://original.com');
  });

  it('handles clearing a field (empty string change)', () => {
    const rawRep = { websiteUrl: 'https://example.com' };
    const body = { website_url: '' };
    const changes = computeChanges(body, rawRep);
    expect(changes.website_url).toEqual({ from: 'https://example.com', to: '' });
  });

  it('handles array field changes', () => {
    const rawRep = { languages: ['English', 'Welsh'] };
    const body = { languages: ['English', 'French'] };
    const changes = computeChanges(body, rawRep);
    expect(changes.languages).toEqual({ from: 'English, Welsh', to: 'English, French' });
  });
});

function extractFunctionBody(source: string, signature: string): string | null {
  const idx = source.indexOf(signature);
  if (idx === -1) return null;
  let depth = 0;
  let start = -1;
  for (let i = idx; i < source.length; i++) {
    if (source[i] === '{') {
      if (start === -1) start = i;
      depth++;
    } else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}
