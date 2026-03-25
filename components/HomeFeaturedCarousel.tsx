'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Representative } from '@/lib/types';
import { phoneToTelHref } from '@/lib/phone';

export function HomeFeaturedCarousel({ featuredReps }: { featuredReps: Representative[] }) {
  const [current, setCurrent] = useState(0);
  const [showContact, setShowContact] = useState<Record<number, boolean>>({});

  if (!featuredReps || featuredReps.length === 0) return null;

  const rep = featuredReps[current];
  const quote = rep.bio || rep.notes || '';
  const website = rep.websiteUrl || '';

  const toggleContact = (idx: number) => {
    setShowContact((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <section className="section-pad bg-[var(--navy)]" aria-label="Spotlight representatives">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-h2 mt-0 text-white">Featured Premium Reps</h2>
          <p className="mt-2 text-white">Promoted listings with maximum visibility</p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <div className="rounded-[var(--radius-lg)] border-2 border-white bg-[var(--navy-light)] p-6 sm:p-7">
            <h3 className="text-xl font-bold text-white">{rep.name}</h3>
            {quote ? (
              <blockquote className="mt-4 border-l-4 border-[var(--gold)] pl-4 text-sm italic leading-relaxed text-white">
                &ldquo;{quote}&rdquo;
              </blockquote>
            ) : null}

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
              {website ? (
                <Link href={website} target="_blank" rel="noopener noreferrer" className="btn-outline !min-h-[40px] !border-slate-500 !px-4 !py-2 !text-sm !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]">
                  Visit Website
                </Link>
              ) : null}
            </div>

            {showContact[current] && (
              <div className="mt-4 rounded-lg border border-white bg-[var(--navy)] p-4 text-sm text-white">
                {rep.phone ? (
                  <a href={phoneToTelHref(rep.phone)} className="block font-medium text-white no-underline hover:text-[var(--gold)]">
                    📞 {rep.phone}
                  </a>
                ) : null}
                {rep.email ? (
                  <a href={`mailto:${rep.email}`} className="mt-2 block font-medium text-white no-underline hover:text-[var(--gold)]">
                    ✉️ {rep.email}
                  </a>
                ) : null}
                {!rep.phone && !rep.email ? (
                  <p>View the full profile for contact details →</p>
                ) : null}
                <Link href={`/rep/${rep.slug}`} className="mt-2 inline-block font-semibold text-[var(--gold)] no-underline hover:text-[var(--gold-hover)]">
                  Go to profile
                </Link>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrent((c) => (c - 1 + featuredReps.length) % featuredReps.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-white transition-colors hover:bg-white hover:text-[var(--navy)]"
              aria-label="Previous spotlight rep"
            >
              ←
            </button>
            <div className="flex gap-2">
              {featuredReps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${i === current ? 'bg-[var(--gold)] w-6' : 'bg-white hover:bg-[var(--gold-light)]'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent((c) => (c + 1) % featuredReps.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-white transition-colors hover:bg-white hover:text-[var(--navy)]"
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
