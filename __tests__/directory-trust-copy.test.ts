import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  DIRECTORY_LISTING_TRUST_SENTENCE,
  directoryYearsOperating,
} from '@/lib/directory-trust-copy';

const root = path.resolve(__dirname, '..');

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf-8');
}

describe('directory trust copy', () => {
  it('computes years from 2016 foundation', () => {
    expect(directoryYearsOperating(new Date('2026-08-19'))).toBe(10);
  });

  it('uses one shared trust sentence on directory, Terms, and rep profile', () => {
    expect(DIRECTORY_LISTING_TRUST_SENTENCE).toMatch(/listing time/i);
    expect(DIRECTORY_LISTING_TRUST_SENTENCE).toMatch(/do not supervise cases/i);

    for (const rel of ['app/directory/page.tsx', 'app/Terms/page.tsx', 'app/rep/[slug]/page.tsx']) {
      expect(read(rel)).toContain('DIRECTORY_LISTING_TRUST_SENTENCE');
    }
  });

  it('does not ship hardcoded marketing rep/station counts on the homepage', () => {
    const home = read('app/page.tsx');
    expect(home).not.toMatch(/MARKETING_REPS_DISPLAY/);
    expect(home).not.toMatch(/MARKETING_STATIONS_DISPLAY/);
    expect(read('components/HomeHero.tsx')).not.toMatch(/TRUST_BADGE_COUNT\s*=\s*258/);
  });

  it('drops the testing-period featured advert line', () => {
    const advert = read('components/FeaturedListingAdvert.tsx');
    expect(advert).not.toMatch(/testing period/i);
    expect(advert).not.toMatch(/PoliceStationRepUK\.com/);
    expect(advert).toMatch(/£4\.99/);
  });

  it('guards FindYourRep against painting zero Total Reps', () => {
    const src = read('app/FindYourRep/page.tsx');
    expect(src).toContain('hasLiveCounts');
    expect(src).toContain('Loading coverage data');
  });
});
