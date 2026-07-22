import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAllCounties, getAllReps, getAllStations, getStationBySlug, getRepsByStation } from '@/lib/data';
import { buildMetadata, localBusinessSchema, breadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { StationsDataContributeCta } from '@/components/StationsDataContributeCta';
import { StationVerificationBadge } from '@/components/StationVerificationBadge';
import { CustodyContributePrompt } from '@/components/CustodyContributePrompt';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RepCard } from '@/components/RepCard';
import { DirectoryCredentialVerificationNotice } from '@/components/DirectoryCredentialVerificationNotice';
import { FirmCoverCTA } from '@/components/FirmCoverCTA';
import { displayPhoneNumber } from '@/lib/station-search';
import { StationContactDisclaimer } from '@/components/StationPhone';
import { StationPhoneActions } from '@/components/stations/StationPhoneActions';
import { stationPhoneReportHref } from '@/lib/station-phone-report';
import { StationLocationMap } from '@/components/StationLocationMap';
import { countRepsForStation, shouldIndexPoliceStationPage } from '@/lib/station-indexing';
import { directoryHrefForAreaName } from '@/lib/county-links';
import { legalDirectoryHrefForAreaName } from '@/lib/legal-directory/area-links';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import {
  CUSTODYNOTE_BETA_REASON,
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_FREE_LABEL,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';

export const dynamic = 'force-static';
/** ISR: refresh station pages periodically so rep counts and index flags stay fresh. */
export const revalidate = 86_400;

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
  const [allReps, allStations] = await Promise.all([getAllReps(), getAllStations()]);
  const repCount = countRepsForStation(stationData, allReps, allStations);
  const indexable = shouldIndexPoliceStationPage(stationData, repCount);
  const area = stationData.forceName || stationData.county || 'England & Wales';
  const listedPhone = displayPhoneNumber(stationData);
  const phoneSnippet = listedPhone ? ` Phone: ${listedPhone}.` : '';
  return buildMetadata({
    title: `${stationData.name} Police Station — Phone, Address & Reps`,
    description: `${stationData.name} (${area}) — police station telephone numbers, address, and accredited representatives.${phoneSnippet} Report updated numbers if ours are wrong.`,
    path: `/police-station/${stationData.slug}`,
    noIndex: !indexable,
  });
}

export default async function PoliceStationPage({ params }: PageProps) {
  const { station: stationSlug } = await params;
  const station = await getStationBySlug(stationSlug);
  if (!station) notFound();

  if (station.slug !== stationSlug) {
    redirect(`/police-station/${station.slug}`);
  }

  const [reps, counties, allReps, allStations] = await Promise.all([
    getRepsByStation(station.name),
    getAllCounties(),
    getAllReps(),
    getAllStations(),
  ]);
  const countyDirHref =
    directoryHrefForAreaName(station.county, counties) ??
    directoryHrefForAreaName(station.forceName, counties);
  const legalDirHref =
    legalDirectoryHrefForAreaName(station.county) ??
    legalDirectoryHrefForAreaName(station.forceName);
  const repCount = countRepsForStation(station, allReps, allStations);
  const indexable = shouldIndexPoliceStationPage(station, repCount);
  const listedPhone = displayPhoneNumber(station);
  const schema = localBusinessSchema({
    name: station.name,
    slug: station.slug,
    address: station.address,
    county: station.forceName || station.county || '',
    ...(listedPhone ? { telephone: listedPhone } : {}),
  });
  const bc = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Station Directory', url: '/StationsDirectory' },
    { name: `${station.name} Police Station`, url: `/police-station/${station.slug}` },
  ]);
  const areaLabel = station.county || station.forceName || '';
  const isCustody = Boolean(station.isCustodyStation || station.custodySuite);

  return (
    <>
      {indexable && <JsonLd data={schema} />}
      <JsonLd data={bc} />

      {/* Bright contact-first hero — works on phone → desktop */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--navy)] via-[#1e3a5f] to-[#0f2744] py-8 sm:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, var(--gold) 0, transparent 40%), radial-gradient(circle at 90% 10%, #34d399 0, transparent 35%)',
          }}
          aria-hidden
        />
        <div className="page-container relative !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Station Directory', href: '/StationsDirectory' },
              { label: station.name },
            ]}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {station.name}
              <span className="block text-lg font-bold text-[var(--gold)] sm:text-2xl lg:text-3xl">
                Police Station
              </span>
            </h1>
            {isCustody ? (
              <span className="rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-950 sm:text-xs">
                Custody suite
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--gold-light)] sm:text-base lg:text-lg">
            {[station.forceName, station.postcode].filter(Boolean).join(' · ')}
          </p>
          {station.address ? (
            <p className="mt-1 max-w-2xl text-sm text-white/80 sm:text-base">{station.address}</p>
          ) : null}

          <div className="mt-6 rounded-2xl border-2 border-[var(--gold)] bg-[var(--gold-pale)] p-4 shadow-lg sm:mt-8 sm:rounded-3xl sm:p-6 md:p-8">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--navy)] sm:text-base">
              Contact numbers
            </h2>
            <div className="mt-4">
              <StationPhoneActions station={station} bright />
            </div>
            <p className="mt-4 text-center text-xs sm:text-left">
              <Link
                href={stationPhoneReportHref(station.id)}
                className="font-semibold text-[var(--gold-link)] underline hover:text-[var(--navy)]"
              >
                Report a correction
              </Link>
              {' · '}
              <Link
                href="/HelpUsStationNumbers"
                className="font-semibold text-[var(--gold-link)] underline hover:text-[var(--navy)]"
              >
                How updates work
              </Link>
            </p>
            <StationContactDisclaimer className="mt-3" />
          </div>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Main: reps first, then short SEO */}
            <div className="order-2 space-y-6 lg:order-1">
              <section>
                <h2 className="text-h2 text-[var(--navy)]">Representatives covering {station.name}</h2>
                {reps.length > 0 && <DirectoryCredentialVerificationNotice className="mt-4" />}
                {reps.length === 0 ? (
                  <div className="mt-4 space-y-6">
                    <div className="rounded-2xl border-2 border-dashed border-[var(--gold)]/50 bg-[var(--gold-pale)] p-6 text-center sm:p-8">
                      <p className="text-sm text-[var(--navy)] sm:text-base">
                        No representatives listed for this station yet.{' '}
                        <Link href="/register" className="font-bold text-[var(--gold-link)] hover:underline">
                          Register free
                        </Link>{' '}
                        to be listed.
                      </p>
                    </div>
                    <FirmCoverCTA countyName={areaLabel || undefined} />
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5">
                    {reps.map((rep) => (
                      <RepCard key={rep.id} rep={rep} />
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
                <h2 className="text-lg font-bold text-[var(--navy)]">Legal advice at this station</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  When someone is detained at {station.name}, they are entitled to free legal advice under
                  PACE Code C. A police station representative or solicitor can attend custody, review
                  disclosure, sit in on interviews, and make representations about bail.
                  {station.forceName
                    ? ` ${station.name} is part of the ${station.forceName} force area.`
                    : ''}
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  <Link href="/PACE" className="font-medium text-[var(--gold-link)] hover:underline">
                    PACE rights and custody procedures →
                  </Link>
                  {countyDirHref ? (
                    <>
                      {' · '}
                      <Link
                        href={countyDirHref}
                        className="font-medium text-[var(--gold-link)] hover:underline"
                      >
                        {areaLabel || 'Area'} directory hub →
                      </Link>
                    </>
                  ) : null}
                </p>
              </section>

              <section className="rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
                <h2 className="text-lg font-bold text-[var(--navy)]">What happens at a police station?</h2>
                <ol className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  <li className="flex gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-extrabold text-[var(--navy)]">
                      1
                    </span>
                    Custody officer books the detainee in and explains their rights, including free legal advice.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-extrabold text-[var(--navy)]">
                      2
                    </span>
                    DSCC allocates a duty solicitor, or the detainee&apos;s own solicitor is called.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-extrabold text-[var(--navy)]">
                      3
                    </span>
                    The representative reviews disclosure, consults the client, and advises on interview strategy.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-extrabold text-[var(--navy)]">
                      4
                    </span>
                    After interview: representations on charge, bail, or further investigation.
                  </li>
                </ol>
              </section>

              {/* Secondary promos — below fold */}
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-2xl bg-[var(--navy)] p-5 text-center sm:p-6">
                  <h3 className="font-bold text-white">Cover this station?</h3>
                  <p className="mt-2 text-sm text-white/90">
                    Register free and be listed for {station.name}.
                  </p>
                  <Link href="/register" className="btn-gold mt-3 inline-flex !text-sm">
                    Register Free
                  </Link>
                </section>
                <section className="rounded-2xl border-2 border-[var(--gold)] bg-[var(--gold-pale)] p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold-link)]">
                    Featured product
                  </p>
                  <h3 className="mt-1 font-bold text-[var(--navy)]">{CUSTODYNOTE_BRAND_NAME}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--navy)]/85">
                    {CUSTODYNOTE_FREE_LABEL}. {CUSTODYNOTE_BETA_REASON}
                  </p>
                  <a
                    href={CUSTODYNOTE_TRIAL_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold mt-3 inline-flex !text-sm no-underline"
                  >
                    Download free →
                  </a>
                </section>
              </div>
            </div>

            {/* Sidebar: map + location only */}
            <aside className="order-1 space-y-4 lg:order-2">
              <section className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 p-4 shadow-[var(--card-shadow)] sm:p-5">
                <h2 className="text-base font-extrabold text-[var(--navy)] sm:text-lg">Location</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Address
                    </dt>
                    <dd className="mt-0.5 font-medium text-[var(--navy)]">{station.address}</dd>
                  </div>
                  {station.postcode ? (
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Postcode
                      </dt>
                      <dd className="mt-0.5 font-medium text-[var(--navy)]">{station.postcode}</dd>
                    </div>
                  ) : null}
                  {station.forceName ? (
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Force
                      </dt>
                      <dd className="mt-0.5 font-medium text-[var(--navy)]">{station.forceName}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Custody suite
                    </dt>
                    <dd className="mt-0.5 font-medium text-[var(--navy)]">{isCustody ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
                {typeof station.latitude === 'number' && typeof station.longitude === 'number' ? (
                  <div className="mt-4 overflow-hidden rounded-xl">
                    <StationLocationMap
                      lat={station.latitude}
                      lng={station.longitude}
                      name={station.name}
                    />
                  </div>
                ) : null}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white no-underline hover:bg-emerald-700"
                >
                  Get directions
                </a>
                <StationVerificationBadge station={station} />
                <CustodyContributePrompt station={station} />
              </section>
              <StationsDataContributeCta variant="slim" />
            </aside>
          </div>

          <nav className="mt-10 flex flex-wrap gap-3 text-sm sm:gap-4" aria-label="Related directory links">
            {legalDirHref ? (
              <Link
                href={legalDirHref}
                className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
              >
                Criminal legal services in {areaLabel || 'this area'} →
              </Link>
            ) : (
              <Link
                href={LEGAL_DIRECTORY_BASE}
                className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
              >
                Legal Services Directory →
              </Link>
            )}
            {countyDirHref ? (
              <Link
                href={countyDirHref}
                className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
              >
                View all reps in {station.county || station.forceName || 'this area'} →
              </Link>
            ) : (
              <Link
                href="/directory/counties"
                className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
              >
                Browse county hubs →
              </Link>
            )}
            <Link
              href="/StationsDirectory"
              className="font-medium text-[var(--muted)] no-underline hover:text-[var(--gold-hover)]"
            >
              ← Station search
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
