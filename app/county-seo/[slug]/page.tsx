import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CountySeoTemplate } from '@/components/CountySeoTemplate';
import {
  COUNTY_SEO_PAGES,
  getCountySeoData,
} from '@/lib/county-seo-pages';
import { buildMetadata } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-static';

export function generateStaticParams() {
  return COUNTY_SEO_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = COUNTY_SEO_PAGES.find((p) => p.slug === slug);
  if (!page) return {};
  return buildMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${page.pageSlug}`,
  });
}

export default async function CountySeoPage({ params }: PageProps) {
  const { slug } = await params;
  const page = COUNTY_SEO_PAGES.find((p) => p.slug === slug);
  if (!page) notFound();

  const { reps, stations } = await getCountySeoData(page);

  return <CountySeoTemplate page={page} reps={reps} stations={stations} />;
}
