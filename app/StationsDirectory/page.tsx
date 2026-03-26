import Link from 'next/link';
import { getAllStations } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StationsDirectoryExplorer } from '@/components/StationsDirectoryExplorer';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'UK Police Station Directory — Custody Suites & Contacts',
  description:
    'Browse and search the UK police station directory by name, force, or county. Find contact details, addresses and accredited representatives covering each station across England & Wales.',
  path: '/StationsDirectory',
});

export const dynamic = 'force-static';

export default async function StationsDirectoryPage() {
  const stations = await getAllStations();

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Station Directory', href: '/StationsDirectory' },
            ]}
          />
          <div className="mb-3 mt-3 inline-flex items-center gap-2 rounded-full border border-white bg-[var(--navy-light)] px-3 py-1 text-xs font-medium text-white">
            <span>✓</span> Community Verified
          </div>
          <h1 className="text-h1 text-white">Police Stations &amp; Forces Directory</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            Contact details and representative coverage for police stations across England &amp;
            Wales. {stations.length > 0 ? `${stations.length} stations listed.` : ''}
          </p>
        </div>
      </section>

      <div className="page-container">
        <StationsDirectoryExplorer stations={stations} />

        <div className="mt-14 border-t border-[var(--border)] pt-10">
          <h2 className="text-h2 text-[var(--navy)]">Find a Representative</h2>
          <p className="mt-2 text-[var(--muted)]">
            Search our directory of accredited police station representatives covering these stations.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/directory" className="btn-gold">
              Search Directory
            </Link>
            <Link href="/directory/counties" className="btn-outline">
              Browse by County
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
