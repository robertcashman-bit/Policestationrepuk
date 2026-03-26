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
  /** Absolute URL to Open Graph / Twitter image */
  ogImage?: { url: string; width?: number; height?: number; alt?: string };
}

export function buildMetadata(opts: MetadataInput): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  const ogType = opts.ogType ?? 'website';

  const ogImages =
    opts.ogImage?.url != null
      ? [
          {
            url: opts.ogImage.url,
            width: opts.ogImage.width ?? 1200,
            height: opts.ogImage.height ?? 630,
            alt: opts.ogImage.alt,
          },
        ]
      : undefined;

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
          ...(ogImages ? { images: ogImages } : {}),
        }
      : {
          title: opts.title,
          description: opts.description,
          url,
          siteName: SITE_NAME,
          type: 'website',
          locale: 'en_GB',
          ...(ogImages ? { images: ogImages } : {}),
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
      ...(ogImages?.[0]?.url ? { images: [ogImages[0].url] } : {}),
    },
    robots: opts.noIndex ? { index: false, follow: true } : undefined,
  };
}
