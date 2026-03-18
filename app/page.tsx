import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { HomeHero } from '@/components/HomeHero';
import { HomeHowItWorks } from '@/components/HomeHowItWorks';
import { HomeRegisterCta } from '@/components/HomeRegisterCta';
import { HomeKentSpotlight } from '@/components/HomeKentSpotlight';
import { HomeTrainingResources } from '@/components/HomeTrainingResources';
import { DirectoryCard } from '@/components/DirectoryCard';
import { getAllReps, getAllStations, getAllCounties } from '@/lib/data';
import { organizationSchema, webSiteSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'PoliceStationRepUK — Free Police Station Rep Directory UK',
  description:
    "The UK's free directory for police station cover. Find accredited police station representatives by county, station, or name. 100% free for solicitors and reps. No fees ever.",
  alternates: { canonical: 'https://policestationrepuk.com' },
};

const FEATURED_REP_COUNT = 6;
const UK_FORCES_COUNT = 43;

export default async function HomePage() {
  const [reps, stations, counties] = await Promise.all([getAllReps(), getAllStations(), getAllCounties()]);
  const featuredReps = reps.slice(0, FEATURED_REP_COUNT);

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={webSiteSchema() as Record<string, unknown>} />

      {/* 1 — Hero */}
      <HomeHero repCount={reps.length} />

      {/* 2 — Stats bar */}
      <section className="border-b border-[var(--border)] bg-white py-10 sm:py-12">
        <div className="page-container !py-0">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
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

      {/* 3 — Featured representatives */}
      <section className="bg-[var(--background)] py-14 sm:py-16" aria-label="Featured representatives">
        <div className="page-container">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-h2 !mt-0 text-[var(--navy)]">Featured representatives</h2>
              <p className="mt-2 text-[var(--muted)]">
                Accredited police station representatives from our directory.
              </p>
            </div>
            <Link
              href="/directory"
              className="hidden text-sm font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)] sm:block"
            >
              View all {reps.length}+ reps →
            </Link>
          </div>
          {featuredReps.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredReps.map((rep) => (
                <DirectoryCard key={rep.id} rep={rep} />
              ))}
            </div>
          )}
          <p className="mt-8 text-center sm:hidden">
            <Link href="/directory" className="btn-outline !text-sm">
              View full directory →
            </Link>
          </p>
        </div>
      </section>

      {/* 4 — How it works */}
      <HomeHowItWorks />

      {/* 5 — County quick links */}
      <section className="border-y border-[var(--border)] bg-[var(--background)] py-14 sm:py-16">
        <div className="page-container">
          <div className="text-center">
            <h2 className="text-h2 !mt-0 text-[var(--navy)]">Browse by county</h2>
            <p className="mt-2 text-[var(--muted)]">
              Find representatives in your area.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {counties.slice(0, 20).map((county) => (
              <Link
                key={county.slug}
                href={`/directory/${county.slug}`}
                className="rounded-full border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)] no-underline shadow-sm transition-all hover:border-[var(--gold)]/40 hover:shadow-md"
              >
                {county.name}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center">
            <Link href="/PoliceStationRepsByCounty" className="text-sm font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
              View all counties →
            </Link>
          </p>
        </div>
      </section>

      {/* 6 — Kent spotlight */}
      <HomeKentSpotlight />

      {/* 7 — Training resources */}
      <HomeTrainingResources />

      {/* 8 — Register CTA */}
      <HomeRegisterCta />
    </>
  );
}
