import { describe, expect, it } from 'vitest';
import { applyFirmGeoToInputs, buildFirmGeoMap } from '@/lib/firm-outreach/dscc-geo-join';
import { filterKentInputs } from '@/lib/firm-outreach/kent-filter';
import type { RawProspectInput } from '@/lib/firm-outreach/merge-prospects';

describe('dscc geo join', () => {
  it('copies Kent postcode onto matching DSCC solicitor so Kent filter keeps them', () => {
    const laa: RawProspectInput[] = [
      {
        prospectType: 'firm',
        firmName: 'Brachers LLP',
        county: 'Kent',
        postcode: 'ME14 1LQ',
        source: 'laa',
      },
    ];
    const dscc: RawProspectInput[] = [
      {
        prospectType: 'solicitor',
        firmName: 'Brachers LLP',
        forename: 'Jane',
        surname: 'Smith',
        source: 'dscc',
      },
      {
        prospectType: 'solicitor',
        firmName: 'Remote Northern LLP',
        forename: 'Bob',
        surname: 'Jones',
        source: 'dscc',
      },
    ];
    const geo = buildFirmGeoMap(laa);
    const joined = applyFirmGeoToInputs(dscc, geo);
    const kent = filterKentInputs(joined);
    expect(kent).toHaveLength(1);
    expect(kent[0].surname).toBe('Smith');
    expect(kent[0].postcode).toBe('ME14 1LQ');
  });

  it('does not invent geo for unmatched DSCC firms', () => {
    const joined = applyFirmGeoToInputs(
      [
        {
          prospectType: 'firm',
          firmName: 'Unknown Firm',
          source: 'dscc',
        },
      ],
      buildFirmGeoMap([]),
    );
    expect(filterKentInputs(joined)).toHaveLength(0);
  });
});
