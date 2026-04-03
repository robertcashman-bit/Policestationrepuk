/**
 * Public support / directory help inbox (sitewide mailto + footer).
 * Change this to e.g. support@policestationrepuk.org when that address forwards to your team.
 */
export const SUPPORT_EMAIL = 'robertcashman@defencelegalservices.co.uk';

const DEFAULT_SUBJECT = 'PoliceStationRepUK — support';

export const SUPPORT_MAILTO_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(DEFAULT_SUBJECT)}`;

export function supportMailtoHref(subject = DEFAULT_SUBJECT): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
