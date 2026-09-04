import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import {
  FIND_STATION_TITLE,
  INSTRUCT_KENT_HREF,
  INSTRUCT_PRIMARY_HREF,
  INSTRUCT_PRIMARY_LABEL,
  NOT_POLICE_HEADLINE,
  STATIONS_DIRECTORY_TITLE,
  STATION_PAGE_TITLE_SUFFIX,
} from '@/lib/gsc-harness-copy';
import { STATION_CONTACT_DISCLAIMER } from '@/lib/station-contacts/types';

describe('GSC harness copy', () => {
  it('deflects police-phone intent and points to 101/999', () => {
    expect(NOT_POLICE_HEADLINE).toMatch(/not the police/i);
    expect(STATION_CONTACT_DISCLAIMER).toMatch(/not the police/i);
    expect(STATION_CONTACT_DISCLAIMER).toMatch(/101/);
    expect(STATION_CONTACT_DISCLAIMER).toMatch(/999/);
    expect(STATION_CONTACT_DISCLAIMER).toMatch(/public use/i);
  });

  it('exposes a primary instruct path and Kent cover hub', () => {
    expect(INSTRUCT_PRIMARY_LABEL).toMatch(/instruct/i);
    expect(INSTRUCT_PRIMARY_HREF).toBe('/directory');
    expect(INSTRUCT_KENT_HREF).toBe('/KentAgentCover');
  });

  it('softens station/directory SEO away from phone-number bait', () => {
    expect(STATION_PAGE_TITLE_SUFFIX).toMatch(/representative/i);
    expect(STATION_PAGE_TITLE_SUFFIX.toLowerCase()).not.toContain('phone');
    expect(STATIONS_DIRECTORY_TITLE.toLowerCase()).not.toContain('phone number');
    expect(FIND_STATION_TITLE.toLowerCase()).not.toContain('phone number');
  });
});

describe('GSC harness wiring', () => {
  it('homepage hero includes deflect banner and instruct CTA', async () => {
    const hero = await fs.readFile('components/HomeHero.tsx', 'utf-8');
    expect(hero).toContain('NotPoliceDeflectBanner');
    expect(hero).toContain('InstructRepPrimaryCta');
  });

  it('station pages use representative-first title and deflect banner', async () => {
    const page = await fs.readFile('app/police-station/[station]/page.tsx', 'utf-8');
    expect(page).toContain('STATION_PAGE_TITLE_SUFFIX');
    expect(page).toContain('NotPoliceDeflectBanner');
    expect(page).toContain('InstructRepPrimaryCta');
    expect(page).not.toContain('Phone, Address & Reps');
  });

  it('StationsDirectory and find-station softens phone bait', async () => {
    const stations = await fs.readFile('app/StationsDirectory/page.tsx', 'utf-8');
    const find = await fs.readFile('app/find-station/page.tsx', 'utf-8');
    expect(stations).toContain('STATIONS_DIRECTORY_TITLE');
    expect(stations).toContain('NotPoliceDeflectBanner');
    expect(find).toContain('FIND_STATION_TITLE');
    expect(find).toContain('NotPoliceDeflectBanner');
    expect(find).not.toContain('Find a Police Station Phone Number');
  });

  it('Kent custody suites no longer highlight public switchboard numbers', async () => {
    const page = await fs.readFile('app/KentCustodySuites/page.tsx', 'utf-8');
    expect(page).toContain('NotPoliceDeflectBanner');
    expect(page).toContain('InstructRepPrimaryCta');
    expect(page).not.toMatch(/tel:\s*['"]?\(/);
    expect(page).not.toContain('(01622)');
  });
});

describe('.com → .org host redirects', () => {
  it('vercel.json redirects apex and www .com to .org', async () => {
    const raw = await fs.readFile('vercel.json', 'utf-8');
    const json = JSON.parse(raw) as {
      redirects: Array<{ has?: Array<{ value: string }>; destination: string; statusCode: number }>;
    };
    const hosts = json.redirects.flatMap((r) => r.has?.map((h) => h.value) ?? []);
    expect(hosts).toContain('policestationrepuk.com');
    expect(hosts).toContain('www.policestationrepuk.com');
    expect(
      json.redirects.some(
        (r) =>
          r.destination.startsWith('https://policestationrepuk.org') &&
          r.statusCode === 301 &&
          r.has?.some((h) => h.value === 'policestationrepuk.com'),
      ),
    ).toBe(true);
  });

  it('middleware and next.config also canonicalize .com hosts', async () => {
    const middleware = await fs.readFile('middleware.ts', 'utf-8');
    const nextConfig = await fs.readFile('next.config.ts', 'utf-8');
    expect(middleware).toContain("host === 'policestationrepuk.com'");
    expect(middleware).toContain('policestationrepuk.org');
    expect(nextConfig).toContain('policestationrepuk.com');
    expect(nextConfig).toContain('https://policestationrepuk.org/:path*');
  });
});
