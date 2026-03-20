'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Representative } from '@/lib/types';

function getAvailabilityBadge(raw: string): { label: string; color: string } {
  const lower = raw.toLowerCase().trim();
  if (/24\s*[\/\s]?\s*7|24\s*hour|all\s*hour|anytime|any\s*time|full\s*time|mon-sun\s*24/i.test(lower))
    return { label: '24/7', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' };
  if (/evening|night|after\s*(5|6|7|8)|out\s*of\s*hours|pm\s*onwards/i.test(lower))
    return { label: 'Evenings / Nights', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' };
  if (/weekend|sat.*sun/i.test(lower))
    return { label: 'Weekends', color: 'bg-violet-500/10 text-violet-700 border-violet-200' };
  if (/day(time|s)|morning|afternoon|mon.*fri|9.*5|8.*6/i.test(lower))
    return { label: 'Daytime', color: 'bg-blue-500/10 text-blue-700 border-blue-200' };
  if (/flexi|arrangement|please\s*call|usually|general/i.test(lower))
    return { label: 'Flexible', color: 'bg-amber-500/10 text-amber-700 border-amber-200' };
  if (!raw || lower === 'any' || lower === 'all' || lower === 'most')
    return { label: 'Available', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' };
  return { label: raw.length > 20 ? raw.slice(0, 18) + '…' : raw, color: 'bg-slate-100 text-slate-700 border-slate-200' };
}

export interface DirectoryCardProps {
  rep: Representative;
}

export function DirectoryCard({ rep }: DirectoryCardProps) {
  const [showContact, setShowContact] = useState(false);
  const avail = getAvailabilityBadge(rep.availability || '');
  const phoneHref = rep.phone ? `tel:${rep.phone.replace(/\s/g, '')}` : null;

  return (
    <article className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white shadow-[var(--card-shadow)] transition-all duration-200 hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--gold)]/40">
      <div className="h-1 rounded-t-[var(--radius-lg)] bg-gradient-to-r from-[var(--navy)] to-[var(--navy-mid)]" />

      <div className="flex flex-1 flex-col p-[var(--card-padding)]">
        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${avail.color}`}>
            {avail.label}
          </span>
          <span className="rounded-full bg-[var(--navy)]/5 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--navy)]">
            {(rep.accreditation || '').includes('Duty')
              ? 'Duty Solicitor'
              : (rep.accreditation || '').includes('Probationary')
                ? 'Probationary'
                : 'Accredited'}
          </span>
          {rep.featured && (
            <span className="rounded-full bg-[var(--gold)]/10 px-2.5 py-0.5 text-[11px] font-bold text-[var(--gold-hover)]">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-lg font-bold tracking-tight text-[var(--navy)]">
          {rep.name}
        </h3>

        {/* Quote/bio */}
        {rep.bio && (
          <blockquote className="mt-2 border-l-2 border-[var(--gold)]/30 pl-3 text-xs italic leading-relaxed text-[var(--muted)]">
            &ldquo;{rep.bio.length > 120 ? rep.bio.slice(0, 118) + '…' : rep.bio}&rdquo;
          </blockquote>
        )}

        {/* Counties */}
        <p className="mt-2 text-sm font-medium text-[var(--muted)]">
          {rep.county?.trim() ? rep.county : 'Coverage: see full profile'}
        </p>

        {/* Stations as pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(rep.stations || []).slice(0, 4).map((station) => (
            <span
              key={station}
              className="rounded-full bg-[var(--gold-pale)] px-2.5 py-0.5 text-xs font-medium text-[var(--navy)]"
            >
              {station}
            </span>
          ))}
          {(rep.stations || []).length > 4 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-[var(--muted)]">
              +{(rep.stations || []).length - 4} more
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Show Contact Details toggle */}
        {showContact && (
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
            {phoneHref && (
              <a href={phoneHref} className="block text-sm font-medium text-[var(--navy)] no-underline hover:text-[var(--gold-hover)]">
                📞 {rep.phone}
              </a>
            )}
            {rep.email && (
              <a href={`mailto:${rep.email}`} className="mt-1 block text-sm font-medium text-[var(--navy)] no-underline hover:text-[var(--gold-hover)]">
                ✉️ {rep.email}
              </a>
            )}
            {!rep.phone && !rep.email && (
              <p className="text-sm text-[var(--muted)]">View full profile for contact details</p>
            )}
          </div>
        )}

        {/* CTA footer */}
        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
          <button
            onClick={() => setShowContact((v) => !v)}
            className="btn-gold !min-h-[40px] w-full !px-3 !py-2 !text-sm"
          >
            {showContact ? 'Hide Contact Details' : 'Show Contact Details'}
          </button>
          <div className="flex gap-2">
            <Link
              href={`/rep/${rep.slug}`}
              className="btn-outline flex-1 !min-h-[40px] !px-3 !py-2 !text-sm"
            >
              View Full Profile
            </Link>
            {rep.websiteUrl && (
              <a
                href={rep.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex-1 !min-h-[40px] !px-3 !py-2 !text-sm"
              >
                Visit Website
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
