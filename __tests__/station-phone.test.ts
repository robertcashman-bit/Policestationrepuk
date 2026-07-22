import { describe, expect, it } from 'vitest';
import {
  classifyPhone,
  extractPhoneDigitsFromQuery,
  findClearStationMatch,
  normalizePhone,
  searchStations,
  stationPhoneNumbers,
} from '@/lib/station-search';
import { deriveStationCounty, withDerivedCounty } from '@/lib/force-county';
import type { PoliceStation } from '@/lib/types';

const stub = (overrides: Partial<PoliceStation>): PoliceStation =>
  ({
    id: '1',
    slug: 'test',
    name: 'Test Station',
    address: '',
    ...overrides,
  }) as PoliceStation;

describe('normalizePhone', () => {
  it('strips spaces and punctuation', () => {
    expect(normalizePhone('020 7230 1212')).toBe('02072301212');
  });
  it('normalises +44 to leading 0', () => {
    expect(normalizePhone('+44 800 405040')).toBe('0800405040');
  });
  it('normalises 0044 to leading 0', () => {
    expect(normalizePhone('0044 161 872 5050')).toBe('01618725050');
  });
});

describe('reverse phone search', () => {
  it('extracts digit queries for reverse lookup', () => {
    expect(extractPhoneDigitsFromQuery('020 7230 1212')).toBe('02072301212');
    expect(extractPhoneDigitsFromQuery('+44 20 7230 1212')).toBe('02072301212');
    expect(extractPhoneDigitsFromQuery('101')).toBe('101');
    expect(extractPhoneDigitsFromQuery('Maidstone')).toBeNull();
  });

  it('finds stations by phone digits', () => {
    const stations = [
      stub({
        id: 'a',
        name: 'Alpha Station',
        forceName: 'Metropolitan Police',
        phone: '020 7230 1212',
      }),
      stub({
        id: 'b',
        name: 'Beta Station',
        forceName: 'Kent Police',
        custodyPhone: '01622 690690',
        verificationMeta: {
          fields: {
            custodyPhone: {
              status: 'verified',
              sourceUrl: 'https://www.kent.police.uk/contact/',
              dateVerified: '2026-06-02',
            },
          },
        },
      }),
    ];
    const hits = searchStations('01622 690690', stations);
    expect(hits[0]?.id).toBe('b');
    expect(hits[0]?._score).toBeGreaterThanOrEqual(120);
  });
});

describe('findClearStationMatch', () => {
  it('returns the only result when scored', () => {
    const only = { ...stub({ id: '1', slug: 'one', name: 'One' }), _score: 70 };
    expect(findClearStationMatch([only])?.id).toBe('1');
  });

  it('returns top when clearly ahead of the rest', () => {
    const top = { ...stub({ id: '1', slug: 'top', name: 'Top' }), _score: 90 };
    const other = { ...stub({ id: '2', slug: 'other', name: 'Other' }), _score: 40 };
    expect(findClearStationMatch([top, other])?.id).toBe('1');
  });

  it('returns null when matches are ambiguous', () => {
    const a = { ...stub({ id: '1', slug: 'a', name: 'A' }), _score: 70 };
    const b = { ...stub({ id: '2', slug: 'b', name: 'B' }), _score: 65 };
    expect(findClearStationMatch([a, b])).toBeNull();
  });
});

describe('classifyPhone', () => {
  it('classifies a direct station line', () => {
    expect(
      classifyPhone(
        stub({
          forceName: 'Devon and Cornwall Police',
          custodyPhone: '01392 290820',
          verificationMeta: {
            fields: {
              custodyPhone: {
                status: 'verified',
                sourceUrl: 'https://www.devon-cornwall.police.uk/contact/custody-information/',
                dateVerified: '2026-06-02',
              },
            },
          },
        }),
      ),
    ).toBe('station');
  });
  it('classifies a known switchboard regardless of format', () => {
    expect(classifyPhone(stub({ forceName: 'Metropolitan Police', phone: '+44 20 7230 1212' }))).toBe(
      'switchboard',
    );
  });
  it('treats nonEmergencyPhone "101" as generic (was previously none)', () => {
    expect(
      classifyPhone(stub({ forceName: 'Kent Police', nonEmergencyPhone: '101' })),
    ).toBe('generic');
  });
  it('falls back to custodyPhone2 when other fields empty', () => {
    expect(
      classifyPhone(
        stub({
          forceName: 'Devon and Cornwall Police',
          custodyPhone2: '01392 290820',
          verificationMeta: {
            fields: {
              custodyPhone2: {
                status: 'verified',
                sourceUrl: 'https://www.devon-cornwall.police.uk/contact/custody-information/',
                dateVerified: '2026-06-02',
              },
            },
          },
        }),
      ),
    ).toBe('station');
  });
  it('returns none when no number present', () => {
    expect(classifyPhone(stub({}))).toBe('none');
  });
});

describe('stationPhoneNumbers', () => {
  const officialCustodyMeta = {
    verificationMeta: {
      fields: {
        custodyPhone: {
          status: 'verified' as const,
          sourceUrl: 'https://www.devon-cornwall.police.uk/contact/custody-information/',
          dateVerified: '2026-06-02',
        },
      },
    },
  };

  it('returns distinct labelled numbers', () => {
    const entries = stationPhoneNumbers(
      stub({
        custodyPhone: '01392 290820',
        phone: '101',
        nonEmergencyPhone: '101',
        forceName: 'Devon and Cornwall Police',
        ...officialCustodyMeta,
      }),
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ label: 'Custody desk', className: 'station' });
    expect(entries[1]).toMatchObject({ label: 'Station main line', className: 'generic' });
  });
  it('dedupes numbers that differ only by formatting', () => {
    const entries = stationPhoneNumbers(
      stub({
        forceName: 'Metropolitan Police',
        phone: '+44 20 7230 1212',
      }),
    );
    expect(entries).toHaveLength(1);
  });

  it('lists custody before generic non-emergency', () => {
    const entries = stationPhoneNumbers(
      stub({
        custodyPhone: '01392 290820',
        phone: '101',
        nonEmergencyPhone: '101',
        forceName: 'Devon and Cornwall Police',
        ...officialCustodyMeta,
      }),
    );
    expect(entries[0]?.label).toBe('Custody desk');
    expect(entries.some((e) => e.className === 'generic')).toBe(true);
  });

  it('returns only BTP non-emergency when that is the sole number', () => {
    const entries = stationPhoneNumbers(
      stub({
        forceName: 'British Transport Police',
        nonEmergencyPhone: '0800 40 50 40',
      }),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ className: 'generic', number: '0800 40 50 40', verified: true });
  });

  it('excludes unverified station main lines from dialable entries', () => {
    const entries = stationPhoneNumbers(
      stub({
        forceName: 'British Transport Police',
        phone: '0118 957 2022',
        verificationMeta: {
          fields: {
            phone: {
              status: 'unverified',
              dateVerified: '2026-06-02',
            },
          },
        },
      }),
    );
    expect(entries).toHaveLength(0);
  });
});

describe('deriveStationCounty', () => {
  it('keeps an existing county', () => {
    expect(deriveStationCounty(stub({ county: 'Kent' }))).toBe('Kent');
  });
  it('maps Metropolitan Police to London', () => {
    expect(deriveStationCounty(stub({ forceName: 'Metropolitan Police' }))).toBe('London');
  });
  it('strips the force suffix as a fallback', () => {
    expect(deriveStationCounty(stub({ forceName: 'Madeup Constabulary' }))).toBe('Madeup');
  });
  it('falls back to Other with no force', () => {
    expect(deriveStationCounty(stub({}))).toBe('Other');
  });
  it('withDerivedCounty populates the field', () => {
    expect(withDerivedCounty(stub({ forceName: 'Kent Police' })).county).toBe('Kent');
  });
});
