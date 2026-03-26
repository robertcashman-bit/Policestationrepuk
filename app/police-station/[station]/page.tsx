import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStationBySlug, getRepsByStation } from '@/lib/data';
import type { PoliceStation } from '@/lib/types';
import { buildMetadata, localBusinessSchema, breadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RepCard } from '@/components/RepCard';
import { phoneToTelHref } from '@/lib/phone';
import { classifyPhone, displayPhoneNumber } from '@/lib/station-search';

export const dynamic = 'force-static';
export const revalidate = false;

interface PageProps {
  params: Promise<{ station: string }>;
}

export async function generateStaticParams() {
  const { getAllStations } = await import('@/lib/data');
  const stations = await getAllStations();
  return stations.map((s) => ({ station: s.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { station } = await params;
  const stationData = await getStationBySlug(station);
  if (!stationData) return {};
  return buildMetadata({
    title: `${stationData.name} Police Station | Representatives`,
    description: `Police station representatives covering ${stationData.name}, ${stationData.forceName || stationData.county || ''}. Find accredited reps for custody suite attendance and duty solicitor cover.`,
    path: `/police-station/${station}`,
  });
}

export default async function PoliceStationPage({ params }: PageProps) {
  const { station: stationSlug } = await params;
  const station = await getStationBySlug(stationSlug);
  if (!station) notFound();

  const reps = await getRepsByStation(station.name);
  const schema = localBusinessSchema({ name: station.name, slug: station.slug, address: station.address, county: station.forceName || station.county || '' });
  const bc = breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Directory', url: '/directory' }, { name: `${station.name} Police Station`, url: `/police-station/${station.slug}` }]);

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={bc} />

      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-12">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Directory', href: '/directory' },
              { label: `${station.name}` },
            ]}
          />
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-h1 text-white">{station.name} Police Station</h1>
            {(station.isCustodyStation || station.custodySuite) && (
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                Custody Suite
              </span>
            )}
          </div>
          <p className="mt-2 text-lg text-[var(--gold)]">{station.forceName || station.county}</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Main content */}
            <div className="space-y-6">
              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">Legal representation at this station</h2>
                <p className="mt-3 leading-relaxed text-[var(--muted)]">
                  When someone is detained at {station.name} Police Station, they are entitled to free legal advice. A police station representative or solicitor can attend the custody suite to advise the detainee, review disclosure, sit in on police interviews, and make representations about bail.
                </p>
              </section>

              <section>
                <h2 className="text-h2 text-[var(--navy)]">Representatives covering {station.name}</h2>
                {reps.length === 0 ? (
                  <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-8 text-center shadow-[var(--card-shadow)]">
                    <p className="text-[var(--muted)]">
                      No representatives listed for this station yet.{' '}
                      <Link href="/register" className="text-[var(--gold-hover)] hover:underline">Register free</Link> to be listed.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {reps.map((rep) => (
                      <RepCard key={rep.id} rep={rep} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">Station details</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Address</dt>
                    <dd className="mt-0.5 text-[var(--navy)]">{station.address}</dd>
                  </div>
                  {station.forceName && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Force</dt>
                      <dd className="mt-0.5 text-[var(--navy)]">{station.forceName}</dd>
                    </div>
                  )}
                  {station.postcode && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Postcode</dt>
                      <dd className="mt-0.5 text-[var(--navy)]">{station.postcode}</dd>
                    </div>
                  )}
                  <StationPhoneDetail station={station} />
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Custody suite</dt>
                    <dd className="mt-0.5 text-[var(--navy)]">{(station.isCustodyStation || station.custodySuite) ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline mt-4 w-full !text-sm"
                >
                  Get Directions
                </a>
              </section>

              <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-6 text-center">
                <h3 className="font-bold text-white">Cover this station?</h3>
                <p className="mt-2 text-sm text-white">
                  Register free and be listed for {station.name}.
                </p>
                <Link href="/register" className="btn-gold mt-3 w-full !text-sm">
                  Register Free
                </Link>
              </section>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={`/directory/${(station.county || station.forceName || '').toLowerCase().replace(/\s+/g, '-')}`}
              className="font-medium text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]"
            >
              View all reps in {station.forceName || station.county || 'this area'} →
            </Link>
            <Link href="/directory" className="font-medium text-[var(--muted)] no-underline hover:text-[var(--gold-hover)]">
              ← Back to directory
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function StationPhoneDetail({ station }: { station: PoliceStation }) {
  const cls = classifyPhone(station);
  const number = displayPhoneNumber(station);

  if (cls === 'station' && number) {
    return (
      <div>
        <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Phone</dt>
        <dd className="mt-0.5">
          <a href={phoneToTelHref(number)} className="font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
            {number}
          </a>
        </dd>
      </div>
    );
  }

  if (cls === 'switchboard' && number) {
    return (
      <div>
        <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Phone</dt>
        <dd className="mt-0.5">
          <a href={phoneToTelHref(number)} className="font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
            {number}
          </a>
          <span className="mt-0.5 block text-[10px] text-[var(--muted)]">Force switchboard</span>
        </dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Phone</dt>
      <dd className="mt-0.5 text-[var(--muted)]">
        No direct number — call 101 for non-emergency enquiries
      </dd>
    </div>
  );
}
