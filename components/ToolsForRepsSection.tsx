import Link from 'next/link';
import { CUSTODYNOTE_TRIAL_HREF } from '@/lib/custodynote-promo';
import { FOOTER_TOOLS } from '@/lib/site-navigation';
import { LeadMagnetEmailCapture } from '@/components/LeadMagnetEmailCapture';

/**
 * “Tools for Police Station Reps” — CustodyNote first; other tools from site nav.
 */
export function ToolsForRepsSection() {
  const rest = FOOTER_TOOLS.filter((l) => !l.href.includes('custodynote'));

  return (
    <section className="border-b border-[var(--border)] bg-slate-50 py-12 sm:py-14" aria-labelledby="tools-for-reps-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="tools-for-reps-heading" className="text-2xl font-extrabold tracking-tight text-[var(--navy)] sm:text-3xl">
          Tools for Police Station Reps
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Software and resources to work faster at the police station — starting with attendance notes.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col rounded-2xl border-2 border-[var(--gold)] bg-gradient-to-br from-[var(--navy)] to-[#152e6e] p-6 text-white shadow-xl sm:p-8">
              <span className="inline-flex w-fit rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-bold text-[var(--navy)]">
                #1 for reps
              </span>
              <h3 className="mt-4 text-xl font-extrabold sm:text-2xl">CustodyNote</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                PACE-aligned custody and attendance notes — structured fields, works offline, AES-256 encryption, PDF
                export. Built for accredited representatives.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Structured notes in minutes
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Offline-first
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Instant PDF output
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={CUSTODYNOTE_TRIAL_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--gold)] px-6 py-3 text-sm font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
                >
                  Start Free Trial
                </a>
                <Link
                  href="/CustodyNote"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-white/30 px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-white/10"
                >
                  Learn more
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-400">Advertisement — see our disclosure.</p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">More tools &amp; guides</h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {rest.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[44px] items-center rounded-lg border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] shadow-sm no-underline transition-colors hover:border-[var(--gold)]/50 hover:bg-[var(--gold-pale)]"
                    >
                      {link.label}
                      <span className="ml-auto text-xs text-slate-400">↗</span>
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="flex min-h-[44px] items-center rounded-lg border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] shadow-sm no-underline transition-colors hover:border-[var(--gold)]/50 hover:bg-[var(--gold-pale)]"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <LeadMagnetEmailCapture />
      </div>
    </section>
  );
}
