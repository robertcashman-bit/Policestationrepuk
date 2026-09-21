'use client';

import Link from 'next/link';
import { AnalyticsEvents } from '@/lib/analytics';

export function HomeRegisterCta() {
  return (
    <section
      className="section-pad relative overflow-hidden bg-[var(--navy)]"
      aria-label="Join directory call to action"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(250,204,21,0.16), transparent 55%)',
        }}
        aria-hidden
      />
      <div className="page-container relative !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
            For representatives
          </p>
          <h2 className="font-display mt-2 text-h2 text-white">
            Join the directory — free
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            Get discovered by criminal defence firms. Accredited listings only. No fees, ever.
          </p>
          <p className="mt-2 text-sm text-white/70">Takes 2–3 minutes</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/register"
              onClick={() => AnalyticsEvents.registerCtaClick('home_register_cta')}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[var(--gold)] px-6 py-3 text-sm font-extrabold text-[var(--navy)] shadow-md no-underline transition-colors hover:bg-[var(--gold-hover)] sm:w-auto"
            >
              Create my free profile
            </Link>
            <Link
              href="/directory"
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-white/50 px-6 py-3 text-sm font-bold text-white no-underline transition-colors hover:border-[var(--gold)] hover:bg-white/10 sm:w-auto"
            >
              Search directory
            </Link>
            <Link
              href="/StationsDirectory"
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-white/50 px-6 py-3 text-sm font-bold text-white no-underline transition-colors hover:border-[var(--gold)] hover:bg-white/10 sm:w-auto"
            >
              Station numbers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
