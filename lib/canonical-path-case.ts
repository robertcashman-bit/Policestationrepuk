/**
 * PascalCase App Router folders that should publicly canonicalize to lowercase URLs.
 * Middleware 301s `/Contact` → `/contact` and rewrites `/contact` → `/Contact` (filesystem).
 *
 * Blog stays PascalCase (`/Blog`) — case-insensitive FS + historical redirects make it fragile.
 */
export const LOWERCASE_CANONICAL_FOLDERS = [
  'Contact',
  'WhatsApp',
  'FAQ',
  'About',
  'AboutFounder',
  'Privacy',
  'Terms',
  'Cookies',
  'GDPR',
  'Resources',
  'GettingStarted',
  'GetWork',
  'CustodyNote',
  'HowToBecome',
  'Accessibility',
  'Complaints',
  'DataProtection',
  'FormsLibrary',
  'Forum',
  'Forces',
  'PACE',
  'Map',
  'Premium',
  'Subscribe',
  'Account',
  'Profile',
  'Wiki',
  'LegalUpdates',
  'Advertising',
  'Advertisers',
  'BeginnersGuide',
  'PoliceStationCover',
  'PoliceStationRates',
  'PoliceStationRepPay',
  'PoliceStationRepJobsUK',
  'PoliceStationRepsByCounty',
  'StationsDirectory',
  'HelpUsStationNumbers',
  'WhatDoesRepDo',
  'DutySolicitorVsRep',
  'EscapeFeeCalculator',
  'FindSupervisingSolicitor',
  'GoFeatured',
  'Join',
  'ICO',
  'KentPoliceStationReps',
  'KentAgentCover',
  'KentCustodySuites',
  'RepFAQMaster',
  'RepsHub',
  'FirmsWhatsAppGroup',
  'SolicitorPoliceStationCoverUK',
  'CriminalLawCareerGuide',
  'BuildPortfolioGuide',
  'PrepareForCIT',
  'PrepareForWrittenExam',
  'CommonOffencesGuide',
  'InterviewUnderCaution',
  'PoliceDisclosureGuide',
  'MagistratesCourtFees',
  'CrownCourtFees',
  'AccreditedRepresentativeGuide',
  'DSCCRegistrationGuide',
  'MediaKit',
  'RegionalDemandHeatmap',
] as const;

/** Longest folder first so `/AboutFounder` wins over `/About`. */
const FOLDERS_BY_LENGTH = [...LOWERCASE_CANONICAL_FOLDERS].sort(
  (a, b) => b.length - a.length,
);

export type CanonicalPathCaseResult = {
  /** Public URL path (lowercase). */
  canonicalPath: string;
  /** Filesystem App Router path (PascalCase). */
  rewritePath: string;
  /** True when the request path already equals the public canonical. */
  isCanonical: boolean;
};

/**
 * If `pathname` is under a lowercase-canonical folder (any case), return
 * canonical + rewrite targets. Nested paths like `/WhatsApp/reps` are supported.
 */
export function resolveCanonicalPathCase(pathname: string): CanonicalPathCaseResult | null {
  for (const folder of FOLDERS_BY_LENGTH) {
    const pascal = `/${folder}`;
    const lower = `/${folder.toLowerCase()}`;
    if (pathname === pascal || pathname.startsWith(`${pascal}/`)) {
      const rest = pathname.slice(pascal.length);
      return {
        canonicalPath: `${lower}${rest}`,
        rewritePath: pathname,
        isCanonical: false,
      };
    }
    if (pathname === lower || pathname.startsWith(`${lower}/`)) {
      const rest = pathname.slice(lower.length);
      return {
        canonicalPath: pathname,
        rewritePath: `${pascal}${rest}`,
        isCanonical: true,
      };
    }
  }
  return null;
}

/** Public href helper for nav/footer — maps known PascalCase folders to lowercase. */
export function publicPath(href: string): string {
  if (!href.startsWith('/')) return href;
  const qIndex = href.indexOf('?');
  const hashIndex = href.indexOf('#');
  let end = href.length;
  if (qIndex >= 0) end = Math.min(end, qIndex);
  if (hashIndex >= 0) end = Math.min(end, hashIndex);
  const path = href.slice(0, end);
  const suffix = href.slice(end);
  const resolved = resolveCanonicalPathCase(path);
  if (!resolved) return href;
  return `${resolved.canonicalPath}${suffix}`;
}
