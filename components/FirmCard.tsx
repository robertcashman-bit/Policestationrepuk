import type { LawFirm } from '@/lib/types';

export interface FirmCardProps {
  firm: LawFirm;
}

export function FirmCard({ firm }: FirmCardProps) {
  const phoneHref = firm.phone ? `tel:${firm.phone.replace(/\s/g, '')}` : null;
  const websiteUrl =
    firm.website && !firm.website.startsWith('http')
      ? `https://${firm.website}`
      : firm.website || null;

  return (
    <article className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white shadow-[var(--card-shadow)] transition-all duration-200 hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--gold)]/40">
      <div className="h-1 rounded-t-[var(--radius-lg)] bg-gradient-to-r from-[var(--navy)] to-[var(--navy-mid)]" />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Badges row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {firm.policeStationWork && (
            <span className="rounded-full border border-emerald-200 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Police Station
            </span>
          )}
          {firm.dutySolicitorScheme && (
            <span className="rounded-full border border-blue-200 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Duty Solicitor
            </span>
          )}
        </div>

        {/* Firm name */}
        <h3 className="text-lg font-bold tracking-tight text-[var(--navy)]">
          {firm.name}
        </h3>

        {/* Address */}
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
          {firm.address}
        </p>

        {/* County pill */}
        <div className="mt-3">
          <span className="rounded-full bg-[var(--navy)]/5 px-2.5 py-0.5 text-xs font-semibold text-[var(--navy)]">
            {firm.county}
          </span>
        </div>

        {/* Specialisms */}
        {firm.specialisms.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {firm.specialisms.slice(0, 4).map((s) => (
              <span
                key={s}
                className="rounded-full bg-[var(--gold-pale)] px-2.5 py-0.5 text-xs font-medium text-[var(--navy)]"
              >
                {s}
              </span>
            ))}
            {firm.specialisms.length > 4 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-[var(--muted)]">
                +{firm.specialisms.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Contact footer */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          {phoneHref && (
            <a
              href={phoneHref}
              aria-label={`Call ${firm.name}`}
              className="btn-gold flex-1 !min-h-[40px] !px-3 !py-2 !text-sm text-center"
            >
              Call
            </a>
          )}
          {firm.email && (
            <a
              href={`mailto:${firm.email}`}
              aria-label={`Email ${firm.name}`}
              className="btn-outline flex-1 !min-h-[40px] !px-3 !py-2 !text-sm text-center"
            >
              Email
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${firm.name} website`}
              className="btn-outline flex-1 !min-h-[40px] !px-3 !py-2 !text-sm text-center"
            >
              Website
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
