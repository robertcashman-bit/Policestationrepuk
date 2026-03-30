'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Representative } from '@/lib/types';
import { phoneToTelHref } from '@/lib/phone';
import { RepTrustBadges } from '@/components/RepTrustBadges';

function getAvailabilityBadge(raw: string): { label: string; color: string } {
  const lower = raw.toLowerCase().trim();
  if (/24\s*[\/\s]?\s*7|24\s*hour|all\s*hour|anytime|any\s*time|full\s*time|mon-sun\s*24/i.test(lower))
    return { label: '24/7', color: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40' };
  if (/evening|night|after\s*(5|6|7|8)|out\s*of\s*hours|pm\s*onwards/i.test(lower))
    return { label: 'Evenings / nights', color: 'bg-indigo-500/15 text-indigo-900 border-indigo-400/35' };
  if (/weekend|sat.*sun/i.test(lower))
    return { label: 'Weekends', color: 'bg-violet-500/15 text-violet-900 border-violet-400/35' };
  if (/day(time|s)|morning|afternoon|mon.*fri|9.*5|8.*6/i.test(lower))
    return { label: 'Daytime', color: 'bg-sky-500/15 text-sky-900 border-sky-400/35' };
  if (/flexi|arrangement|please\s*call|usually|general/i.test(lower))
    return { label: 'Flexible', color: 'bg-amber-500/12 text-amber-950 border-amber-400/35' };
  if (!raw || lower === 'any' || lower === 'all' || lower === 'most')
    return { label: 'Available', color: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40' };
  return {
    label: raw.length > 22 ? raw.slice(0, 20) + '…' : raw,
    color: 'bg-slate-100 text-slate-800 border-slate-300/60',
  };
}

export type MatchHighlight = 'top' | 'runner' | null;

export interface DirectoryCardProps {
  rep: Representative;
  /** Visual emphasis when using Recommended ranking */
  matchHighlight?: MatchHighlight;
}

export function DirectoryCard({ rep, matchHighlight }: DirectoryCardProps) {
  const [showContact, setShowContact] = useState(false);
  const avail = getAvailabilityBadge(rep.availability || '');
  const phoneHref = rep.phone ? phoneToTelHref(rep.phone) : null;
  const excerpt = (rep.bio || rep.notes || '').trim();
  const accLabel = (rep.accreditation || '').includes('Duty')
    ? 'Duty solicitor'
    : (rep.accreditation || '').includes('Probationary')
      ? 'Probationary'
      : 'Accredited rep';

  const ringClass =
    matchHighlight === 'top'
      ? 'ring-2 ring-[var(--gold)]/70 shadow-lg shadow-[var(--navy)]/10'
      : matchHighlight === 'runner'
        ? 'ring-1 ring-[var(--gold)]/35'
        : '';

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--navy)]/25 hover:shadow-[0_12px_40px_-8px_rgba(30,58,138,0.18)] ${ringClass}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--navy)] via-[var(--navy-mid)] to-[var(--gold)] opacity-90" />

      {matchHighlight === 'top' && (
        <div className="absolute right-3 top-4 z-10 rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[var(--ink)] shadow-sm">
          Top match
        </div>
      )}
      {matchHighlight === 'runner' && (
        <div className="absolute right-3 top-4 z-10 rounded-full border border-[var(--gold)]/50 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--navy)]">
          Strong match
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 pt-6 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${avail.color}`}
          >
            {avail.label}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--navy)]">
            {accLabel}
          </span>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-[var(--navy)] sm:text-[1.35rem]">{rep.name}</h3>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-[var(--muted)]">
          <span className="font-medium text-slate-700">{rep.county?.trim() || 'Coverage on profile'}</span>
          {rep.yearsExperience != null && rep.yearsExperience > 0 && (
            <>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <span>{rep.yearsExperience}+ yrs experience</span>
            </>
          )}
        </p>

        <div className="mt-3">
          <RepTrustBadges rep={rep} variant="card" />
        </div>

        {excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{excerpt}</p>
        ) : null}

        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Stations</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(rep.stations || []).slice(0, 4).map((station) => (
              <span
                key={station}
                className="max-w-full truncate rounded-md bg-[var(--gold-pale)] px-2 py-1 text-xs font-medium text-[var(--navy)] ring-1 ring-[var(--gold)]/25"
                title={station}
              >
                {station}
              </span>
            ))}
            {(rep.stations || []).length > 4 && (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                +{(rep.stations || []).length - 4} more
              </span>
            )}
            {!(rep.stations || []).length && (
              <span className="text-xs text-slate-500">See profile for coverage</span>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {showContact && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            {phoneHref && (
              <a
                href={phoneHref}
                className="block text-sm font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-hover)]"
              >
                {rep.phone}
              </a>
            )}
            {rep.email && (
              <a
                href={`mailto:${rep.email}`}
                className="mt-1 block text-sm font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-hover)]"
              >
                {rep.email}
              </a>
            )}
            {!rep.phone && !rep.email && (
              <p className="text-sm text-[var(--muted)]">Open profile for contact options</p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            {phoneHref ? (
              <a
                href={phoneHref}
                className="btn-gold flex-1 !min-h-[44px] justify-center text-center text-sm font-bold no-underline"
              >
                Call now
              </a>
            ) : null}
            <Link
              href={`/rep/${rep.slug}`}
              className={`btn-outline flex-1 !min-h-[44px] text-center text-sm font-semibold no-underline ${phoneHref ? '' : 'w-full'}`}
            >
              View profile
            </Link>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowContact((v) => !v)}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50"
            >
              {showContact ? 'Hide details' : 'Email & details'}
            </button>
            {rep.websiteUrl && (
              <a
                href={rep.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-[var(--navy)] no-underline transition-colors hover:bg-slate-50"
              >
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
