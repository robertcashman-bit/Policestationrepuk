import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { HomeHero } from '@/components/HomeHero';
import { HomeCustodyNote } from '@/components/HomeCustodyNote';
import { ToolsForRepsSection } from '@/components/ToolsForRepsSection';
import { HomeRecentlyJoined } from '@/components/HomeRecentlyJoined';
import { HomeTrainingResources } from '@/components/HomeTrainingResources';
import { HomeFeaturedCarousel } from '@/components/HomeFeaturedCarousel';
import { HomeWhyChoose } from '@/components/HomeWhyChoose';
import { HomeTestimonials } from '@/components/HomeTestimonials';
import { HomeBlogPreview } from '@/components/HomeBlogPreview';
import { HomeRegisterCta } from '@/components/HomeRegisterCta';
import { HomeQuickSearch } from '@/components/HomeQuickSearch';
import { HomePhoneNumbers } from '@/components/HomePhoneNumbers';
import { HomeAIAssistant } from '@/components/HomeAIAssistant';
import { HomeKentSpotlight } from '@/components/HomeKentSpotlight';
import { HomeSeoConversionHub } from '@/components/HomeSeoConversionHub';
import { HomeHomepageFaq } from '@/components/HomeHomepageFaq';
import { getAllReps, getAllStations, getAllCounties } from '@/lib/data';
import {
  organizationSchema,
  webSiteSchema,
  faqPageSchema,
  directoryServiceLocalBusinessSchema,
} from '@/lib/seo';
import { HOMEPAGE_FAQS } from '@/lib/homepage-faqs';
import { SITE_NAME, SITE_URL, socialPreviewImageUrl } from '@/lib/seo-layer/config';

export const metadata: Metadata = {
  title: 'Police Station Reps UK | Find Police Station Representatives',
  description:
    'Free directory of accredited police station representatives across England & Wales. Find reps by county, station, or name — 100% free for firms and reps. No fees, no middleman.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Police Station Reps UK | Find Police Station Representatives',
    description:
      'Find experienced police station representatives across the UK. Connect with available reps quickly and easily.',
    url: SITE_URL,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    images: [
      {
        url: socialPreviewImageUrl(),
        width: 1200,
        height: 630,
        alt: 'Police Station Reps UK — find police station representatives',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Police Station Reps UK',
    description: 'Find police station representatives across the UK.',
    images: [socialPreviewImageUrl()],
  },
};

const UK_FORCES_COUNT = 42;
const MARKETING_REPS_DISPLAY = 300;
const MARKETING_STATIONS_DISPLAY = 500;

export default async function HomePage() {
  const [reps, stations, counties] = await Promise.all([getAllReps(), getAllStations(), getAllCounties()]);
  const featuredReps = reps.filter((r) => r.featured).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={webSiteSchema() as Record<string, unknown>} />
      <JsonLd data={faqPageSchema(HOMEPAGE_FAQS)} />
      <JsonLd data={directoryServiceLocalBusinessSchema() as Record<string, unknown>} />

      <HomeHero />

      {/* Trust stats strip */}
      <section className="border-b border-[var(--border)] bg-white py-8 sm:py-10" aria-label="Site statistics">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {[
              { value: `${MARKETING_REPS_DISPLAY}+`, label: 'Registered Reps' },
              { value: `${MARKETING_STATIONS_DISPLAY}+`, label: 'Stations Listed' },
              { value: String(UK_FORCES_COUNT), label: 'Police Forces' },
              { value: 'Since 2016', label: 'Established' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold leading-none text-[var(--navy)] sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform disclaimer */}
      <section className="border-b border-[var(--gold)]/20 bg-[var(--gold-pale)] py-4" aria-label="Platform notice">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-xs leading-relaxed text-[var(--navy)]/80">
            <strong className="font-bold text-[var(--navy)]">PoliceStationRepUK is a directory</strong> — not a law
            firm, agency, or provider of legal services. It connects criminal defence firms with accredited
            representatives. Any engagement is a direct contract between the instructing firm and the
            representative. Firms retain responsibility for instruction, supervision, and regulatory compliance.{' '}
            <Link href="/About" className="font-semibold text-[var(--navy)] underline">Learn more about the directory</Link>
          </p>
        </div>
      </section>

      <HomeCustodyNote />

      <ToolsForRepsSection />

      <div className="cv-auto">
        <HomeSeoConversionHub />
      </div>

      <div className="cv-auto">
        <HomeKentSpotlight />
      </div>

      <HomeRecentlyJoined reps={reps} />

      <div className="cv-auto">
        <HomeWhyChoose />
      </div>

      <div className="cv-auto">
        <HomeTrainingResources />
      </div>

      <div className="cv-auto">
        <HomeFeaturedCarousel featuredReps={featuredReps} />
      </div>

      <div className="cv-auto">
        <HomeTestimonials />
      </div>

      <div className="cv-auto">
        <HomeBlogPreview />
      </div>

      <div className="cv-auto">
        <HomeRegisterCta />
      </div>

      <div className="cv-auto">
        <HomeQuickSearch
          stations={stations.map((s) => s.name)}
          counties={counties.map((c) => c.name)}
        />
      </div>

      <div className="cv-auto">
        <HomeHomepageFaq />
      </div>

      <div className="cv-auto">
        <HomePhoneNumbers />
      </div>

      <div className="cv-auto">
        <HomeAIAssistant />
      </div>
    </>
  );
}
