import Link from 'next/link';
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

export const metadata: Metadata = {
  title: 'Home | PoliceStationRepUK — Find Accredited Police Station Reps',
  description:
    "The UK's free directory for police station cover. Find accredited police station representatives by county, station, or name. 100% free for solicitors and reps. No fees ever.",
  alternates: { canonical: 'https://policestationrepuk.com' },
};

const UK_FORCES_COUNT = 43;

export default async function HomePage() {
  const [reps, stations, counties] = await Promise.all([getAllReps(), getAllStations(), getAllCounties()]);

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={webSiteSchema() as Record<string, unknown>} />

      {/* 1 — Hero */}
      <HomeHero repCount={reps.length} />

      {/* 2 — Stats: Trusted Nationwide Coverage */}
      <section className="border-b border-[var(--border)] bg-white py-10 sm:py-12" aria-label="Site statistics">
        <div className="page-container !py-0">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">Trusted Nationwide Coverage</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Real-time access to the UK&apos;s largest network</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            <div>
              <p className="text-3xl font-extrabold text-[var(--navy)] sm:text-4xl">{reps.length}+</p>
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">Representatives</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[var(--navy)] sm:text-4xl">{stations.length}+</p>
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">Stations</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[var(--navy)] sm:text-4xl">{UK_FORCES_COUNT}</p>
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">Police Forces</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[var(--navy)] sm:text-4xl">{counties.length}</p>
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">Counties Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 — CustodyNote promo */}
      <HomeCustodyNote />

      {/* 4 — Recently Joined */}
      <HomeRecentlyJoined reps={reps} />

      {/* 5 — Training Guides (detailed) */}
      <HomeTrainingResources />

      {/* 6 — Featured Premium Reps carousel */}
      <HomeFeaturedCarousel />

      {/* 7 — Why Choose */}
      <HomeWhyChoose />

      {/* 8 — Testimonials */}
      <HomeTestimonials />

      {/* 9 — Blog preview */}
      <HomeBlogPreview />

      {/* 10 — Join the Directory CTA */}
      <HomeRegisterCta />

      {/* 11 — Quick Search + Out-of-hours */}
      <HomeQuickSearch />

      {/* 12 — Phone Numbers */}
      <HomePhoneNumbers />

      {/* 13 — AI Assistant */}
      <HomeAIAssistant />

      {/* 14 — Kent Spotlight */}
      <HomeKentSpotlight />

      {/* 15 — Second Training block (footer-adjacent) */}
      <section className="bg-white py-14 sm:py-16">
        <div className="page-container !py-0">
          <div className="text-center">
            <h3 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">
              Training Guides &amp; Resources
            </h3>
            <p className="mt-2 text-[var(--muted)]">
              Access training guides, Rep Wiki, and professional resources — all free.
            </p>
          </div>
          <div className="mt-6 flex justify-center">
            <Link href="/Resources" className="btn-gold !text-sm">
              Browse Resources →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
