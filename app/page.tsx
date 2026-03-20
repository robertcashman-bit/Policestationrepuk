import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { HomeHero } from '@/components/HomeHero';
import { HomeCustodyNote } from '@/components/HomeCustodyNote';
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
import { getAllReps, getAllStations, getAllCounties } from '@/lib/data';
import { organizationSchema, webSiteSchema } from '@/lib/seo';
import { SITE_URL } from '@/lib/seo-layer/config';

export const metadata: Metadata = {
  title: 'Home | PoliceStationRepUK — Find Accredited Police Station Reps',
  description:
    "The UK's free directory for police station cover. Find accredited police station representatives by county, station, or name. 100% free for solicitors and reps. No fees ever.",
  alternates: { canonical: SITE_URL },
};

/** Matches homepage / Wix crawl marketing strip (rounded figures — not live DB totals). */
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

      <HomeHero />

      <section className="section-pad-compact border-b border-[var(--border)] bg-white" aria-label="Site statistics">
        <div className="page-container !py-0">
          <div className="text-center">
            <h2 className="text-h2 mt-0 text-[var(--navy)]">Trusted Nationwide Coverage</h2>
            <p className="mt-1.5 text-sm leading-normal text-[var(--muted)]">Real-time access to the UK&apos;s largest network</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 text-center sm:mt-6 sm:gap-6">
            <div>
              <p className="text-[1.75rem] font-extrabold leading-none text-[var(--navy)] sm:text-4xl">
                {MARKETING_REPS_DISPLAY}+
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">Reps</p>
            </div>
            <div>
              <p className="text-[1.75rem] font-extrabold leading-none text-[var(--navy)] sm:text-4xl">
                {MARKETING_STATIONS_DISPLAY}+
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">Stations</p>
            </div>
            <div>
              <p className="text-[1.75rem] font-extrabold leading-none text-[var(--navy)] sm:text-4xl">{UK_FORCES_COUNT}</p>
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">Forces</p>
            </div>
          </div>
        </div>
      </section>

      <HomeKentSpotlight />

      <HomeCustodyNote />

      <HomeRecentlyJoined reps={reps} />

      <HomeTrainingResources />

      <HomeFeaturedCarousel featuredReps={featuredReps} />

      <HomeWhyChoose />

      <HomeTestimonials />

      <HomeBlogPreview />

      <HomeRegisterCta />

      <HomeQuickSearch
        stations={stations.map((s) => s.name)}
        counties={counties.map((c) => c.name)}
      />

      <HomePhoneNumbers />

      <HomeAIAssistant />
    </>
  );
}
