import Link from 'next/link';
import { AdvertisementLabel } from './AdvertisementLabel';

/** Soft secondary Kent note — directory acquisition first; no hard PSA sell. */
export function HomeKentSpotlight() {
  return (
    <section
      className="section-pad border-y border-[var(--border)] bg-slate-50"
      aria-labelledby="kent-directory-heading"
    >
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <AdvertisementLabel variant="light" label="Related" />
          <h2 id="kent-directory-heading" className="text-h3 mt-3 text-[var(--navy)]">
            Looking for Kent police station cover?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Start with the free PoliceStationRepUK directory — filter Kent reps by station and contact them
            directly. Agency solicitor cover is a separate service and is not required to use this site.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/directory/kent" className="btn-primary !text-sm">
              Browse Kent reps
            </Link>
            <Link href="/police-station-rep-kent" className="btn-outline !text-sm">
              Kent cover guide
            </Link>
            <Link href="/whatsapp/firms" className="btn-outline !text-sm">
              Firm WhatsApp group
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
