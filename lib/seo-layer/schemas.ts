import { publicDirectoryPhone } from '@/lib/operator-public-phones';
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, socialPreviewImageUrl } from './config';

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
    inLanguage: 'en-GB',
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/directory?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/find-station?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    ],
  };
}

/** Site-wide operator as Organization (directory platform — not a LegalService provider). */
export function platformLegalServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'England and Wales',
    },
    knowsAbout: [
      'Police station representative directory',
      'UK police station directory — find accredited representatives',
      'Criminal defence firm police station cover',
      'Accredited police station reps England and Wales',
    ],
  };
}

export function legalServiceSchema(rep: {
  name: string;
  slug: string;
  counties: string[];
  accreditation: string;
  phone: string;
}) {
  const telephone = publicDirectoryPhone(rep.phone);
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: `${rep.name} — Police Station Representative`,
    url: `${SITE_URL}/rep/${rep.slug}`,
    ...(telephone ? { telephone } : {}),
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
  telephone?: string;
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
    ...(station.telephone ? { telephone: station.telephone } : {}),
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

/** FAQPage JSON-LD for homepage, pillar pages, etc. */
export function faqPageSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

/** Directory operator footprint (UK-wide); not a storefront — no operator phone (avoids scrapers treating it as a police line). */
export function directoryServiceLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    image: socialPreviewImageUrl(),
    priceRange: 'Free directory listing',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
    },
    areaServed: [
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'AdministrativeArea', name: 'England' },
      { '@type': 'AdministrativeArea', name: 'Wales' },
    ],
  };
}

/** Editorial byline for BlogPosting JSON-LD (Person); publisher remains the platform org. */
export function blogEditorPersonSchema() {
  return {
    '@type': 'Person',
    name: 'Robert Cashman',
    url: `${SITE_URL}/AboutFounder`,
    jobTitle: 'Founder, PoliceStationRepUK',
  };
}

/** BlogPosting schema for individual blog articles */
export function blogPostingSchema(post: {
  title: string;
  slug: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  imageUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    url: `${SITE_URL}/Blog/${post.slug}`,
    description: post.description,
    ...(post.imageUrl ? { image: [post.imageUrl] } : {}),
    ...(post.datePublished ? { datePublished: post.datePublished } : {}),
    ...(post.dateModified ? { dateModified: post.dateModified } : {}),
    author: blogEditorPersonSchema(),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: socialPreviewImageUrl(),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/Blog/${post.slug}`,
    },
    isPartOf: {
      '@type': 'Blog',
      name: `${SITE_NAME} Blog`,
      url: `${SITE_URL}/Blog`,
    },
  };
}

/** ItemList schema for police station directory (sample of stations for rich results). */
export function stationDirectoryItemListSchema(
  stations: { name: string; slug: string }[],
  totalCount?: number,
) {
  const count = totalCount ?? stations.length;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'UK Police Station Directory — Find a Representative',
    description:
      'Searchable directory of UK police station locations for solicitors and accredited reps arranging cover.',
    numberOfItems: count,
    itemListElement: stations.slice(0, 30).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/police-station/${s.slug}`,
      name: s.name,
    })),
  };
}

/** ItemList schema for directory listing pages (reps grid) */
export function directoryItemListSchema(reps: { name: string; slug: string }[], countyName?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: countyName
      ? `Police Station Representatives in ${countyName}`
      : 'Police Station Representative Directory',
    numberOfItems: reps.length,
    itemListElement: reps.slice(0, 20).map((rep, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/rep/${rep.slug}`,
      name: rep.name,
    })),
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
  const telephone = publicDirectoryPhone(rep.phone);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: rep.name,
    url: `${SITE_URL}/rep/${rep.slug}`,
    ...(telephone ? { telephone } : {}),
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
