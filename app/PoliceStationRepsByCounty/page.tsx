import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { getAllCounties, getRepsByCounty } from '@/lib/data';

export const metadata: Metadata = buildMetadata({
  title: 'Police Station Reps by County | PoliceStationRepUK',
  description:
    'Find accredited police station representatives by county across England & Wales. Browse our free directory organised by region.',
  path: '/PoliceStationRepsByCounty',
});

const COUNTY_PAGES: { name: string; slug: string; href: string; popular?: boolean }[] = [
  { name: 'Kent', slug: 'kent', href: '/directory/kent', popular: true },
  { name: 'Greater London', slug: 'london', href: '/directory/london', popular: true },
  { name: 'Essex', slug: 'essex', href: '/directory/essex', popular: true },
  { name: 'Greater Manchester', slug: 'manchester', href: '/directory/greater-manchester' },
  { name: 'West Midlands', slug: 'west-midlands', href: '/directory/west-midlands' },
  { name: 'West Yorkshire', slug: 'west-yorkshire', href: '/directory/west-yorkshire' },
  { name: 'Surrey', slug: 'surrey', href: '/directory/surrey' },
  { name: 'Sussex', slug: 'sussex', href: '/directory/sussex' },
  { name: 'Hampshire', slug: 'hampshire', href: '/directory/hampshire' },
  { name: 'Norfolk', slug: 'norfolk', href: '/directory/norfolk' },
  { name: 'Suffolk', slug: 'suffolk', href: '/directory/suffolk' },
  { name: 'Berkshire', slug: 'berkshire', href: '/directory/berkshire' },
  { name: 'Hertfordshire', slug: 'hertfordshire', href: '/directory/hertfordshire' },
];

export default async function PoliceStationRepsByCountyPage() {
  const counties = await getAllCounties();
  const countyRepCounts = await Promise.all(
    COUNTY_PAGES.map(async (cp) => {
      const reps = await getRepsByCounty(cp.name);
      return { ...cp, repCount: reps.length };
    }),
  );

  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[{ label: 'Home', href: '/' }, { label: 'Reps by County' }]}
          />
          <h1 className="mt-3 text-h1 text-white">Police Station Reps by County</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Find accredited police station representatives by area. Select a county to view
            available reps and police stations with custody facilities.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countyRepCounts.map((county) => (
              <Link
                key={county.slug}
                href={county.href}
                className="group relative flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)] no-underline transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
              >
                {county.popular && (
                  <span className="absolute top-3 right-3 rounded-full bg-[var(--gold-pale)] px-2.5 py-0.5 text-xs font-bold text-[var(--gold-hover)]">
                    Popular
                  </span>
                )}
                <h2 className="text-lg font-bold text-[var(--navy)] group-hover:text-[var(--gold-hover)]">
                  {county.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {county.repCount > 0
                    ? `${county.repCount} registered rep${county.repCount !== 1 ? 's' : ''}`
                    : 'View available reps'}
                </p>
                <span className="mt-3 text-sm font-semibold text-[var(--gold-hover)]">View reps →</span>
              </Link>
            ))}
          </div>

          {/* Can't find your county? */}
          <section className="mt-12 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-lg font-bold text-white">
              Can&apos;t find your county?
            </h2>
            <p className="mt-2 text-slate-300">
              Use our main directory to search by station name, county, or representative name.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/directory" className="btn-gold">
                Search Full Directory
              </Link>
              <Link href="/directory/counties" className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]">
                View All Counties ({counties.length})
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
