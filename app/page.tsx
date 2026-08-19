import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { HomeHero } from '@/components/HomeHero';
import { SisterToolsSlimBar } from '@/components/SisterToolsSlimBar';
import { HomeCustodyNote } from '@/components/HomeCustodyNote';
import { ToolsForRepsSection } from '@/components/ToolsForRepsSection';
import { HomeRecentlyJoined } from '@/components/HomeRecentlyJoined';
import { HomeTrainingResources } from '@/components/HomeTrainingResources';
import { HomeFeaturedCarousel } from '@/components/HomeFeaturedCarousel';
import { RepSpotlight } from '@/components/RepSpotlight';
import { HomeWhyChoose } from '@/components/HomeWhyChoose';
import { HomeTestimonials } from '@/components/HomeTestimonials';
import { HomeBlogPreview } from '@/components/HomeBlogPreview';
import { HomeRegisterCta } from '@/components/HomeRegisterCta';
import { HomeStationSearch } from '@/components/HomeStationSearch';
import { HomeTopLocations } from '@/components/HomeTopLocations';
import { HomeCommunityWhatsAppPromo } from '@/components/HomeCommunityWhatsAppPromo';
import { HomeKentSpotlight } from '@/components/HomeKentSpotlight';
import { HomeAIAssistant } from '@/components/HomeAIAssistant';
import { HomeSeoConversionHub } from '@/components/HomeSeoConversionHub';
import { HomeHomepageFaq } from '@/components/HomeHomepageFaq';
import { FeaturedListingAdvert } from '@/components/FeaturedListingAdvert';
import { FeaturedListingFaq } from '@/components/FeaturedListingFaq';
import { DirectoryCredentialVerificationNotice } from '@/components/DirectoryCredentialVerificationNotice';
import { LegalDirectoryPromo } from '@/components/legal-directory/LegalDirectoryPromo';
import {
  getAllReps,
  getAllCounties,
  getAllStations,
  getFeaturedRepsSorted,
  stripPrivateFieldsAll,
} from '@/lib/data';
import {
  organizationSchema,
  faqPageSchema,
  directoryServiceLocalBusinessSchema,
} from '@/lib/seo';
import { HOMEPAGE_FAQS } from '@/lib/homepage-faqs';
import { selectTopCountiesForHomepage } from '@/lib/home-top-locations';
import { selectHomepagePreviewReps } from '@/lib/home-directory-preview';
import { getStationPhonePublicStats } from '@/lib/station-phone-stats-server';
import { SITE_NAME, SITE_URL, socialPreviewImageUrl } from '@/lib/seo-layer/config';
import { UK_POLICE_FORCES_COUNT } from '@/lib/uk-police-forces';
import { repMatchesAnyCounty } from '@/lib/county-matching';

export const metadata: Metadata = {
  title: 'Find a Police Station Rep — UK Representative Directory',
  description:
    'Free UK directory of police station representatives and station telephone numbers. Search reps by county or station; report updated custody desk numbers. Join free.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Find a Police Station Rep — UK Representative Directory',
    description:
      'Free UK directory of accredited police station representatives and station telephone numbers. Search reps by county or station; report updated custody desk numbers.',
    url: SITE_URL,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    images: [
      {
        url: socialPreviewImageUrl(),
        width: 1200,
        height: 630,
        alt: 'Find a police station representative — UK directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find a Police Station Rep — UK Directory',
    description: 'Free directory of police station reps and station phone numbers across England & Wales.',
    images: [socialPreviewImageUrl()],
  },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [repsRaw, counties, stations, featuredReps, phoneStats] = await Promise.all([
    getAllReps(),
    getAllCounties(),
    getAllStations(),
    getFeaturedRepsSorted(),
    getStationPhonePublicStats(),
  ]);
  const reps = stripPrivateFieldsAll(repsRaw);
  const topCountiesBase = selectTopCountiesForHomepage(counties, reps, 12);
  const topCounties = topCountiesBase.map((c) => ({
    ...c,
    listedRepCount: reps.filter((r) => repMatchesAnyCounty(r, c.name)).length,
  }));
  const previewReps = selectHomepagePreviewReps(reps, featuredReps, 3);
  const stationCount = stations.length || phoneStats.total;
  const hasLiveDirectoryCounts = reps.length > 0 && stationCount > 0;

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={faqPageSchema(HOMEPAGE_FAQS)} />
      <JsonLd data={directoryServiceLocalBusinessSchema() as Record<string, unknown>} />

      <HomeHero
        listedRepCount={reps.length}
        countyNames={counties.map((c) => c.name)}
        topCounties={topCounties.slice(0, 6)}
        previewReps={previewReps}
      />

      <SisterToolsSlimBar />

      {hasLiveDirectoryCounts && (
        <section
          className="border-b border-[var(--border)] bg-white py-5 sm:py-6"
          aria-label="Site statistics"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4 sm:gap-6">
              {[
                { value: String(reps.length), label: 'Listed Reps' },
                { value: String(stationCount), label: 'Stations Listed' },
                { value: String(phoneStats.directLine), label: 'With Direct Line' },
                { value: String(UK_POLICE_FORCES_COUNT), label: 'Police Forces' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-extrabold leading-none text-[var(--navy)] sm:text-2xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] sm:text-xs">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <HomeTopLocations counties={topCounties} />

      <HomeRecentlyJoined reps={reps} />

      <RepSpotlight reps={reps} />

      <div className="cv-auto">
        <HomeStationSearch stats={phoneStats} />
      </div>

      <HomeCommunityWhatsAppPromo />

      {featuredReps.length > 0 && (
        <div className="page-container pt-6 pb-0">
          <DirectoryCredentialVerificationNotice />
        </div>
      )}

      <HomeFeaturedCarousel featuredReps={featuredReps} />

      <div className="page-container py-8">
        <FeaturedListingAdvert />
        <FeaturedListingFaq className="mt-6" />
      </div>

      <div className="cv-auto">
        <LegalDirectoryPromo variant="section" />
      </div>

      <div className="cv-auto">
        <HomeWhyChoose />
      </div>

      <div className="cv-auto">
        <HomeTestimonials />
      </div>

      <HomeCustodyNote />

      <HomeKentSpotlight />

      <ToolsForRepsSection />

      <div className="cv-auto bg-[var(--navy)]">
        <HomeSeoConversionHub />
      </div>

      <div className="cv-auto">
        <HomeBlogPreview />
      </div>

      <div className="cv-auto">
        <HomeTrainingResources />
      </div>

      <div className="cv-auto">
        <HomeRegisterCta />
      </div>

      <div className="cv-auto">
        <HomeHomepageFaq />
      </div>

      <div className="cv-auto">
        <HomeAIAssistant />
      </div>

      <section
        className="border-t border-[var(--gold)]/20 bg-[var(--gold-pale)] py-4"
        aria-label="Platform notice"
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-xs leading-relaxed text-[var(--navy)]/80">
            <strong className="font-bold text-[var(--navy)]">PoliceStationRepUK is a directory</strong>{' '}
            — not a law firm, agency, or provider of legal services. It connects criminal defence
            firms with accredited representatives. Any engagement is a direct contract between the
            instructing firm and the representative. Firms retain responsibility for instruction,
            supervision, and regulatory compliance.{' '}
            <Link href="/about" className="font-semibold text-[var(--navy)] underline">
              Learn more about the directory
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
