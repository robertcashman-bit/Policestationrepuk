import Link from 'next/link';
import { AdvertisementLabel } from './AdvertisementLabel';

/** Soft directory CTA at end of blog articles — RepUK acquisition. */
export function BlogBottomAd() {
  return (
    <aside
      className="mt-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-slate-50 p-6 sm:p-8"
      aria-label="Find a police station rep"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <AdvertisementLabel variant="light" label="Directory" />
          <h3 className="mt-3 text-lg font-bold text-[var(--navy)]">
            Need police station cover for your firm?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Search the free PoliceStationRepUK directory for accredited representatives across England
            &amp; Wales, or join the verified firm WhatsApp group for real-time cover requests.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            href="/directory"
            className="btn-primary inline-flex justify-center !text-sm !no-underline"
          >
            Find a rep
          </Link>
          <Link
            href="/whatsapp/firms"
            className="inline-flex justify-center rounded-lg border-2 border-[var(--navy)]/15 px-4 py-2.5 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold-hover)]"
          >
            Firm WhatsApp group
          </Link>
        </div>
      </div>
    </aside>
  );
}
