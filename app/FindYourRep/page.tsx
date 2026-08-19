import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getAllReps, getAllStations } from '@/lib/data';
import { SITE_NAME, SITE_URL, socialPreviewImageUrl } from '@/lib/seo-layer/config';

const title = 'Find Your Rep — Station Coverage Across England & Wales';
const description =
  'See how many accredited police station representatives and stations are listed, then search the directory or open the map.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/FindYourRep` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/FindYourRep`,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    images: [{ url: socialPreviewImageUrl(), width: 1200, height: 630, alt: title }],
  },
};

export const dynamic = 'force-dynamic';

/** England & Wales territorial forces commonly cited in directory marketing. */
const UK_FORCES_COUNT = 43;

function maxRepsPerStation(reps: Awaited<ReturnType<typeof getAllReps>>): number {
  const counts = new Map<string, number>();
  for (const rep of reps) {
    const labels = [...(rep.stations || []), ...(rep.stationsCovered || [])];
    for (const label of labels) {
      const key = label.trim().toLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  let max = 0;
  for (const n of counts.values()) {
    if (n > max) max = n;
  }
  return max;
}

export default async function FindYourRepPage() {
  const [reps, stations] = await Promise.all([getAllReps(), getAllStations()]);
  const maxPerStation = maxRepsPerStation(reps);
  const hasLiveCounts = reps.length > 0 && stations.length > 0;

  const stats = hasLiveCounts
    ? [
        { value: String(reps.length), label: 'Total Reps' },
        { value: String(stations.length), label: 'Stations Covered' },
        { value: maxPerStation > 0 ? String(maxPerStation) : '—', label: 'Max Reps per Station' },
        { value: String(UK_FORCES_COUNT), label: 'Police Forces' },
      ]
    : null;

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Find Your Rep' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Find Your Rep</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Discover which representatives cover police stations across England &amp; Wales.
          </p>
          {stats ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-center"
                >
                  <p className="text-2xl font-extrabold text-[var(--gold)] sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm font-medium text-slate-300" role="status">
              Loading coverage data…
            </p>
          )}
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-3xl space-y-8">
          <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
            <h2 className="text-xl font-bold text-[var(--navy)]">Explore coverage</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Counts above are taken from the live public directory at page render — not placeholders.
              Interactive map and force browse tools open in their own views.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Link href="/directory" className="btn-gold no-underline text-center">
                Search Directory
              </Link>
              <Link href="/Map" className="btn-outline no-underline text-center">
                Open Map
              </Link>
              <Link href="/StationsDirectory" className="btn-outline no-underline text-center">
                Station Contacts
              </Link>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Join the network</h2>
            <p className="mt-2 text-sm text-white/80">
              Fully accredited representatives can register free and appear in search results.
            </p>
            <Link href="/register" className="btn-gold mt-5 inline-flex no-underline">
              Get Listed
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
