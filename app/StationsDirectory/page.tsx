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

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

export default async function StationsDirectoryPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
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
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            If a telephone number or address is wrong, use{' '}
            <Link
              href="/UpdateStation"
              className="font-semibold text-[var(--gold)] no-underline hover:underline"
            >
              Suggest a station update
            </Link>{' '}
            — or the &ldquo;Correct phone, address…&rdquo; link on each station card below.
          </p>
        </div>
      </section>

      <div className="page-container">
        <StationsDirectoryExplorer stations={stations} initialQuery={params.q ?? ''} />

        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-bold text-[var(--navy)]">Spotted incorrect information?</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Wrong address, main line, custody suite number, or non-emergency contact? Tell us what
            should change. We review every suggestion before updating the directory.
          </p>
          <Link
            href="/UpdateStation"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)] hover:underline"
          >
            Open the station update form &rarr;
          </Link>
        </div>

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
