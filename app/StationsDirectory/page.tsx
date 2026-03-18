import Link from 'next/link';
import { getAllStations } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'UK Police Station Contact Directory',
  description:
    'Browse and search the UK police station directory. Find contact details, addresses and accredited representatives covering each station across England & Wales.',
  path: '/StationsDirectory',
});

export const dynamic = 'force-static';

export default async function StationsDirectoryPage() {
  const stations = await getAllStations();

  const grouped = stations.reduce<Record<string, typeof stations>>((acc, station) => {
    const key = station.county || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(station);
    return acc;
  }, {});

  const sortedCounties = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

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
          <div className="mb-3 mt-3 inline-flex items-center gap-2 rounded-full border border-slate-400/50 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
            <span>✓</span> Community Verified
          </div>
          <h1 className="text-h1 text-white">Police Stations &amp; Forces Directory</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Contact details and representative coverage for police stations across England &amp;
            Wales. {stations.length > 0 ? `${stations.length} stations listed.` : ''}
          </p>
        </div>
      </section>

      <div className="page-container">

      {stations.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
          <p className="text-[var(--muted)]">Station data loading shortly. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedCounties.map((county) => (
            <section key={county}>
              <h2 className="mb-4 text-lg font-semibold text-[var(--navy)]">{county}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[county].map((station) => (
                  <Link
                    key={station.id}
                    href={`/police-station/${station.slug}`}
                    className="group flex flex-col rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                  >
                    <p className="font-medium text-[var(--navy)] group-hover:text-[var(--gold-hover)]">
                      {station.name}
                    </p>
                    {station.address && (
                      <p className="mt-1 text-xs text-[var(--muted)] line-clamp-1">
                        {station.address}
                      </p>
                    )}
                    {station.phone && (
                      <p className="mt-2 text-xs font-medium text-[var(--gold-hover)]">
                        📞 {station.phone}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-14 border-t border-[var(--border)] pt-10">
        <h2 className="text-h2 text-[var(--navy)]">Find a Representative</h2>
        <p className="mt-2 text-[var(--muted)]">
          Search our directory of accredited police station representatives covering these stations.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/directory"
            className="btn-gold"
          >
            Search Directory
          </Link>
          <Link
            href="/directory/counties"
            className="btn-outline"
          >
            Browse by County
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
