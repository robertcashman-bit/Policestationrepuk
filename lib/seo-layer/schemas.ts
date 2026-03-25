import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from './config';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
  };
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/directory?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Site-wide LegalService (directory platform), distinct from per-rep `legalServiceSchema`. */
export function platformLegalServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: SITE_NAME,
    url: SITE_URL,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'England and Wales',
    },
    serviceType: 'Police Station Representation',
    description: DEFAULT_DESCRIPTION,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
}

export function legalServiceSchema(rep: {
  name: string;
  slug: string;
  counties: string[];
  accreditation: string;
  phone: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: `${rep.name} — Police Station Representative`,
    url: `${SITE_URL}/rep/${rep.slug}`,
    telephone: rep.phone,
    description: `Accredited police station representative covering ${rep.counties.join(', ')}. ${rep.accreditation}.`,
    areaServed: rep.counties.map((c: string) => ({
      '@type': 'AdministrativeArea',
      name: c,
    })),
    serviceType: 'Police Station Representation',
    provider: {
      '@type': 'Person',
      name: rep.name,
    },
  };
}

export function localBusinessSchema(station: {
  name: string;
  slug: string;
  address: string;
  county: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'GovernmentBuilding',
    name: `${station.name} Police Station`,
    url: `${SITE_URL}/police-station/${station.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: station.address,
      addressRegion: station.county,
      addressCountry: 'GB',
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/** Place/AdministrativeArea for county pages */
export function placeSchema(countyName: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `Police Station Representatives in ${countyName}`,
    url: `${SITE_URL}${path}`,
    address: {
      '@type': 'AdministrativeArea',
      name: countyName,
      addressCountry: 'GB',
    },
  };
}

/** Person schema for representative profile pages */
export function personSchema(rep: {
  name: string;
  slug: string;
  phone: string;
  accreditation: string;
  counties: string[];
}) {
  const areas = rep.counties.filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: rep.name,
    url: `${SITE_URL}/rep/${rep.slug}`,
    telephone: rep.phone,
    jobTitle: 'Police Station Representative',
    description: `${rep.accreditation}. Covers ${areas.join(', ') || 'England and Wales'}.`,
    ...(areas.length > 0
      ? {
          areaServed: areas.map((name) => ({
            '@type': 'AdministrativeArea',
            name,
            addressCountry: 'GB',
          })),
        }
      : {}),
  };
}
