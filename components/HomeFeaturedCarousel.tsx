'use client';

import { useState } from 'react';
import Link from 'next/link';

const FEATURED_REPS = [
  {
    name: 'Always available - Usman Iqbal',
    quote: 'Available 24/7 covering police station in West Yorkshire, North Yorkshire Greater Manchester and South Yorkshire!',
    slug: 'usman-iqbal',
  },
  {
    name: 'Robert Cashman',
    quote: '35 years experience in criminal law. Higher Court Advocate qualification. Specialist in high-quality police station representation. Available 24/7 across Kent and Met border areas.',
    slug: 'robert-cashman',
    website: 'https://defencelegalservices.co.uk',
  },
  {
    name: 'Terry Limby',
    quote: '25 years in legal background Within 60 mins travel to any Kent Police Station Priory Court - Border Force/NCA covered HMP Rochester, HMP Swaleside and HMP Elmley covered All notes back within 24 hours',
    slug: 'terry-limby',
    website: 'https://terrylimby.co.uk',
  },
];

export function HomeFeaturedCarousel() {
  const [current, setCurrent] = useState(0);
  const [showContact, setShowContact] = useState<Record<number, boolean>>({});

  const rep = FEATURED_REPS[current];

  const toggleContact = (idx: number) => {
    setShowContact((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <section className="bg-gradient-to-br from-[var(--navy)] to-[var(--navy-mid)] py-14 sm:py-16" aria-label="Spotlight representatives">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Featured Premium Reps</h2>
          <p className="mt-2 text-slate-400">Promoted listings with maximum visibility</p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
            <h3 className="text-xl font-bold text-white">{rep.name}</h3>
            <blockquote className="mt-4 border-l-4 border-[var(--gold)] pl-4 text-sm italic leading-relaxed text-slate-300">
              &ldquo;{rep.quote}&rdquo;
            </blockquote>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => toggleContact(current)}
                className="btn-gold !min-h-[40px] !px-4 !py-2 !text-sm"
              >
                {showContact[current] ? 'Hide Contact Details' : 'Show Contact Details'}
              </button>
              <Link href={`/rep/${rep.slug}`} className="btn-outline !min-h-[40px] !border-slate-500 !px-4 !py-2 !text-sm !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]">
                View Full Profile
              </Link>
              {rep.website && (
                <Link href={rep.website} target="_blank" rel="noopener noreferrer" className="btn-outline !min-h-[40px] !border-slate-500 !px-4 !py-2 !text-sm !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]">
                  Visit Website
                </Link>
              )}
            </div>

            {showContact[current] && (
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p>View the full profile for contact details →</p>
                <Link href={`/rep/${rep.slug}`} className="mt-2 inline-block font-semibold text-[var(--gold)] no-underline hover:text-[var(--gold-hover)]">
                  Go to profile
                </Link>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrent((c) => (c - 1 + FEATURED_REPS.length) % FEATURED_REPS.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
              aria-label="Previous spotlight rep"
            >
              ←
            </button>
            <div className="flex gap-2">
              {FEATURED_REPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${i === current ? 'bg-[var(--gold)] w-6' : 'bg-white/30 hover:bg-white/50'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent((c) => (c + 1) % FEATURED_REPS.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
              aria-label="Next spotlight rep"
            >
              →
            </button>
          </div>

          <p className="mt-6 text-center">
            <Link href="/directory" className="text-sm font-semibold text-[var(--gold)] no-underline hover:text-[var(--gold-hover)]">
              View all representatives
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
