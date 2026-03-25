import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from './config';

export interface MetadataInput {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  /** Set to 'article' for blog/news posts to emit correct OG type and dates. */
  ogType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

export function buildMetadata(opts: MetadataInput): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  const ogType = opts.ogType ?? 'website';

  const openGraph: Metadata['openGraph'] =
    ogType === 'article'
      ? {
          title: opts.title,
          description: opts.description,
          url,
          siteName: SITE_NAME,
          type: 'article',
          locale: 'en_GB',
          ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
          ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
        }
      : {
          title: opts.title,
          description: opts.description,
          url,
          siteName: SITE_NAME,
          type: 'website',
          locale: 'en_GB',
        };

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
    robots: opts.noIndex ? { index: false, follow: true } : undefined,
  };
}
