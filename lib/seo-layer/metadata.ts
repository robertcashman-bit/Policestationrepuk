import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from './config';

export interface MetadataInput {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}

export function buildMetadata(opts: MetadataInput): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
    robots: opts.noIndex ? { index: false, follow: true } : undefined,
  };
}
