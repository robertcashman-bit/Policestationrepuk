import { describe, expect, it } from 'vitest';
import { stationPhoneReportHref } from '@/lib/station-phone-report';

describe('stationPhoneReportHref', () => {
  it('builds UpdateStation deep links with reason and number', () => {
    expect(stationPhoneReportHref('st1')).toBe('/UpdateStation?station=st1');
    expect(
      stationPhoneReportHref('st1', {
        field: 'custodyPhone',
        number: '01622 690690',
        reason: 'not_custody',
      }),
    ).toBe(
      '/UpdateStation?station=st1&field=custodyPhone&number=01622+690690&reason=not_custody',
    );
  });
});
