import { describe, expect, it } from 'vitest';
import {
  buildFindStationSearchUrl,
  buildStationsDirectorySearchUrl,
} from '@/lib/station-directory-links';

describe('buildFindStationSearchUrl', () => {
  it('builds find-station URLs with encoded query', () => {
    expect(buildFindStationSearchUrl('Canterbury')).toBe('/find-station?q=Canterbury');
    expect(buildFindStationSearchUrl('Medway & North')).toBe(
      '/find-station?q=Medway%20%26%20North',
    );
  });

  it('returns bare find-station for empty query', () => {
    expect(buildFindStationSearchUrl('')).toBe('/find-station');
    expect(buildFindStationSearchUrl('   ')).toBe('/find-station');
  });
});

describe('buildStationsDirectorySearchUrl', () => {
  it('aliases to find-station for backwards compatibility', () => {
    expect(buildStationsDirectorySearchUrl('Canterbury')).toBe('/find-station?q=Canterbury');
  });
});
