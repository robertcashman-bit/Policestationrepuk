import { describe, expect, it } from 'vitest';
import {
  isPsrDirectoryFinding,
  isRepDirectoryFinding,
  isSelfDirectoryFinding,
} from '@/lib/custody-discovery/hold-resolver';
import type { CustodyNumberFinding } from '@/lib/custody-discovery/types';

function finding(
  overrides: Partial<CustodyNumberFinding> = {},
): CustodyNumberFinding {
  return {
    id: 'cnf_test',
    custodySuiteId: 'suite_1',
    forceName: 'Kent Police',
    custodySuiteName: 'Medway Custody',
    policeStationName: 'Medway Police Station',
    possiblePhoneNumber: '01634 792190',
    normalizedPhoneNumber: '01634792190',
    sourceTitle: 'test',
    sourceUrl: 'https://example.com',
    sourceDomain: 'example.com',
    sourceType: 'unknown',
    pageSnippet: 'Custody: 01634 792190',
    classification: 'direct_custody',
    confidenceScore: 70,
    confidenceLevel: 'medium',
    status: 'needs_review',
    dateFound: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    hashOfSourceEvidence: 'hash',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('PSR vs self directory policy', () => {
  it('treats policestationreps.com as PSR candidate, not self-rep poison', () => {
    const f = finding({
      sourceDomain: 'policestationreps.com',
      sourceUrl: 'https://www.policestationreps.com/Police_Stations/Medway-Police-Station.php',
    });
    expect(isPsrDirectoryFinding(f)).toBe(true);
    expect(isSelfDirectoryFinding(f)).toBe(false);
    expect(isRepDirectoryFinding(f)).toBe(false);
  });

  it('treats our sites as self-directory (blocked)', () => {
    for (const domain of [
      'policestationrepuk.org',
      'policestationagent.com',
      'policestationrep.com',
    ]) {
      const f = finding({ sourceDomain: domain, sourceUrl: `https://${domain}/x` });
      expect(isSelfDirectoryFinding(f)).toBe(true);
      expect(isRepDirectoryFinding(f)).toBe(true);
      expect(isPsrDirectoryFinding(f)).toBe(false);
    }
  });
});
