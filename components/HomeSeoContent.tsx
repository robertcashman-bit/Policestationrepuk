import Link from 'next/link';

/**
 * Homepage editorial block: targets "Police Station Representative UK" and related solicitor-intent queries.
 * Uses H2/H3 only (single sitewide H1 remains in HomeHero).
 */
export function HomeSeoContent() {
  return (
    <section
      className="border-t border-[var(--border)] bg-slate-50"
      aria-labelledby="home-seo-heading"
    >
      <div className="page-container section-pad-compact">
        <div className="mx-auto max-w-3xl">
          <h2 id="home-seo-heading" className="text-h2 mt-0 text-[var(--navy)]">
            Police Station Representative UK — what solicitors and firms need to know
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
            A <strong className="font-semibold text-[var(--navy)]">police station representative</strong> is an accredited
            professional who attends custody on behalf of the instructing solicitor or firm. Across England and Wales,
            criminal defence practices use police station representatives to protect clients in custody, support police
            interviews, and keep PACE-compliant attendance without stretching in-house teams past capacity.
          </p>

          <h3 className="mt-8 text-xl font-bold text-[var(--navy)]">What this directory does</h3>
          <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
            <Link href="/directory" className="font-semibold text-[var(--navy)] underline decoration-[var(--navy)]/30 underline-offset-2 hover:decoration-[var(--navy)]">
              PoliceStationRepUK
            </Link>{' '}
            lists accredited representatives and related profile details so you can filter by area, custody suite,
            availability, and accreditation. The service is built for{' '}
            <strong className="font-semibold text-[var(--navy)]">solicitors, duty solicitor firms, and police station
            cover coordinators</strong> who need trusted attendance at short notice — not a substitute for your own
            professional judgment, but a practical way to find vetted reps nationwide.
          </p>

          <h3 className="mt-8 text-xl font-bold text-[var(--navy)]">UK-wide coverage</h3>
          <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
            Our listings span forces and counties from London and the South East through the Midlands, the North West,
            Yorkshire, Wales, and beyond. Whether you need overnight cover, weekend rota support, or a regular panel for
            a custody suite you attend often, you can browse representatives by region and station. For granular filters,
            use{' '}
            <Link href="/search" className="font-semibold text-[var(--navy)] underline decoration-[var(--navy)]/30 underline-offset-2 hover:decoration-[var(--navy)]">
              advanced search
            </Link>{' '}
            alongside the main directory hub.
          </p>

          <h3 className="mt-8 text-xl font-bold text-[var(--navy)]">Why firms use a police station representative</h3>
          <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
            Custody work is time-critical: clients need advice before interview, disclosure must be reviewed under
            pressure, and attendance often clashes with court lists, trials, and out-of-hours DSCC call-outs. A police
            station representative extends your firm&apos;s reach with a professional who is used to custody processes,
            interview strategy, and liaison with investigating officers — while you retain control of the retainer and
            overarching case direction. Many practices combine in-house attendance with a panel of trusted reps so they
            can honour duty contracts and private instructions without compromising quality at the station.
          </p>

          <h3 className="mt-8 text-xl font-bold text-[var(--navy)]">PACE, accreditation, and professional standards</h3>
          <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
            Representation at the police station sits within a tightly regulated framework. Representatives must meet the
            accreditation requirements that apply to their role and work within the arrangements set by the instructing
            solicitor. When you choose someone from this directory, use profiles to check accreditation statements,
            areas covered, and availability — then complete your own firm compliance steps as you would for any
            outsource arrangement. Our{' '}
            <Link href="/Resources" className="font-semibold text-[var(--navy)] underline decoration-[var(--navy)]/30 underline-offset-2 hover:decoration-[var(--navy)]">
              resources hub
            </Link>{' '}
            and blog include introductory material on interviews, cautions, and custody rights for teams onboarding new
            staff or refreshing training.
          </p>

          <h3 className="mt-8 text-xl font-bold text-[var(--navy)]">Are you a representative?</h3>
          <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
            If you hold current accreditation and want visibility to defence firms, you can{' '}
            <Link href="/register" className="font-semibold text-[var(--navy)] underline decoration-[var(--navy)]/30 underline-offset-2 hover:decoration-[var(--navy)]">
              create a free profile
            </Link>
            . There is no charge to join or be listed — the aim is to keep valid, accredited capacity visible to the
            profession when it matters most.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/directory"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] bg-[var(--navy)] px-6 py-3 text-center text-sm font-bold text-white shadow-[var(--card-shadow)] transition-colors hover:bg-[var(--navy)]/90 no-underline sm:text-base"
            >
              Browse directory by county
            </Link>
            <Link
              href="/search"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border-2 border-[var(--navy)] bg-white px-6 py-3 text-center text-sm font-bold text-[var(--navy)] transition-colors hover:bg-slate-50 no-underline sm:text-base"
            >
              Open advanced rep search
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
