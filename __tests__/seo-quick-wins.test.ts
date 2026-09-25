import { describe, expect, it } from 'vitest';
import { buildSitemap } from '@/lib/sitemap-build';
import { shouldIncludeMirrorPathInSitemap } from '@/lib/mirror-data';
import { isMirrorCatchAllJunkSlug } from '@/lib/sitemap-mirror-junk';
import { stationPageDocumentTitle, stationPoliceStationLabel } from '@/lib/station-page-title';

describe('sitemap mirror junk', () => {
  const junk = ['N/A', 'FirmProfile', 'RepProfile', 'WikiArticle', 'LegalUpdateDetail', 'SpotlightProfile'];

  it('flags template shells and /N/A as junk slugs', () => {
    for (const slug of junk) {
      expect(isMirrorCatchAllJunkSlug(slug)).toBe(true);
      expect(shouldIncludeMirrorPathInSitemap(slug)).toBe(false);
    }
  });
});

describe('buildSitemap SEO quick wins', () => {
  it('omits junk mirror paths and uses lowercase canonical locs', async () => {
    const entries = await buildSitemap();
    const urls = entries.map((e) => e.url);

    for (const fragment of [
      '/FirmProfile',
      '/RepProfile',
      '/WikiArticle',
      '/LegalUpdateDetail',
      '/SpotlightProfile',
      '/N/A',
      '/n/a',
    ]) {
      expect(urls.some((u) => u.includes(fragment))).toBe(false);
    }

    expect(urls.some((u) => u.endsWith('/updatestation'))).toBe(true);
    expect(urls.some((u) => u.includes('/HowToBecomePoliceStationRep'))).toBe(false);
    expect(urls.some((u) => u.includes('/LegalUpdates/'))).toBe(false);
    expect(urls.some((u) => u.includes('/legalupdates/'))).toBe(true);
    expect(urls.some((u) => u.includes('/Wiki/'))).toBe(false);
    expect(urls.some((u) => u.includes('/wiki/'))).toBe(true);
    expect(urls.some((u) => u.match(/\/Blog\/[^/]+$/))).toBe(true);
  });
});

describe('station page titles', () => {
  it('does not double Police Station in document titles', () => {
    expect(stationPoliceStationLabel('Maidstone Police Station')).toBe('Maidstone Police Station');
    expect(stationPoliceStationLabel('maidstone police station')).toBe('maidstone police station');
    expect(stationPoliceStationLabel('Tonbridge')).toBe('Tonbridge Police Station');
    expect(stationPageDocumentTitle('Maidstone Police Station', 'Find a Rep')).toBe(
      'Maidstone Police Station — Find a Rep',
    );
  });
});
