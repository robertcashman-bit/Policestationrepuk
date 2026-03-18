import Link from 'next/link';
import type { Representative } from '@/lib/types';

export function RepCard({ rep }: { rep: Representative }) {
  const phoneHref = rep.phone ? `tel:${rep.phone.replace(/\s/g, '')}` : null;

  return (
    <article className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)] transition-all duration-200 hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--gold)]/40">
      <div className="mb-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[var(--navy)]/5 px-2.5 py-0.5 text-[11px] font-bold text-[var(--navy)]">
          {rep.accreditation.includes('Duty') ? 'Duty Solicitor' : rep.accreditation.includes('Probationary') ? 'Probationary' : 'Accredited'}
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
          {rep.availability === 'full-time' ? '24/7' : rep.availability.replace(/-/g, ' ')}
        </span>
      </div>
      <h3 className="text-lg font-bold text-[var(--navy)]">
        <Link href={`/rep/${rep.slug}`} className="no-underline hover:text-[var(--gold-hover)]">
          {rep.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{rep.county}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {rep.stations.slice(0, 3).map((s) => (
          <span key={s} className="rounded-full bg-[var(--gold-pale)] px-2 py-0.5 text-xs font-medium text-[var(--navy)]">
            {s}
          </span>
        ))}
        {rep.stations.length > 3 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-[var(--muted)]">
            +{rep.stations.length - 3}
          </span>
        )}
      </div>
      <div className="mt-auto flex gap-2 border-t border-[var(--border)] pt-4 mt-4">
        {phoneHref && (
          <a href={phoneHref} className="btn-gold flex-1 !min-h-[36px] !px-3 !py-1.5 !text-xs">
            📞 Call
          </a>
        )}
        <Link href={`/rep/${rep.slug}`} className="btn-outline flex-1 !min-h-[36px] !px-3 !py-1.5 !text-xs">
          Profile →
        </Link>
      </div>
    </article>
  );
}
