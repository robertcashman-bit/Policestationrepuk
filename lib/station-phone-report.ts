/**
 * Build UpdateStation deep-links for one-tap wrong-number / correction reports.
 */
export function stationPhoneReportHref(
  stationId: string,
  opts?: {
    field?: 'phone' | 'custodyPhone' | 'custodyPhone2' | 'nonEmergencyPhone';
    number?: string;
    reason?: 'wrong' | 'not_custody' | 'outdated' | 'other';
  },
): string {
  const params = new URLSearchParams();
  params.set('station', stationId);
  if (opts?.field) params.set('field', opts.field);
  if (opts?.number) params.set('number', opts.number);
  if (opts?.reason) params.set('reason', opts.reason);
  return `/UpdateStation?${params.toString()}`;
}
