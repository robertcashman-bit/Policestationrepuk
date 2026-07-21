import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Freezes the Phase 1 contact-data baseline so later enrichment cannot
 * silently shrink the directory or wipe verified provenance.
 */
describe('station contacts baseline', () => {
  const baseline = JSON.parse(
    readFileSync(
      resolve(__dirname, '../data/reports/station-contacts-baseline-2026-07-20.json'),
      'utf8',
    ),
  ) as {
    stations: {
      total: number;
      dialablePhone: number;
      custodyStations: number;
    };
    verificationMeta: {
      entries: number;
      phoneVerified: number;
    };
  };

  const stations = JSON.parse(
    readFileSync(resolve(__dirname, '../data/stations.json'), 'utf8'),
  ) as unknown[];

  const verification = JSON.parse(
    readFileSync(resolve(__dirname, '../data/station-verification.json'), 'utf8'),
  ) as Record<string, unknown>;

  it('preserves station directory size at or above baseline', () => {
    expect(stations.length).toBeGreaterThanOrEqual(baseline.stations.total);
    expect(baseline.stations.total).toBe(896);
  });

  it('preserves verification meta coverage at or above baseline', () => {
    const entries = Object.keys(verification).length;
    expect(entries).toBeGreaterThanOrEqual(baseline.verificationMeta.entries);
    expect(baseline.verificationMeta.phoneVerified).toBe(256);
    expect(baseline.stations.custodyStations).toBe(95);
  });
});
