import Link from 'next/link';
import {
  INSTRUCT_CONTACT_HREF,
  INSTRUCT_CONTACT_LABEL,
  INSTRUCT_KENT_HREF,
  INSTRUCT_KENT_LABEL,
  INSTRUCT_PRIMARY_HREF,
  INSTRUCT_PRIMARY_LABEL,
} from '@/lib/gsc-harness-copy';

type Variant = 'hero' | 'panel' | 'inline';

/**
 * One obvious path to instruct / request police station rep or Kent agency cover.
 * Primary action: free directory. Secondary: Kent cover hub + directory contact.
 */
export function InstructRepPrimaryCta({
  variant = 'panel',
  className,
  showKent = true,
  areaHint,
}: {
  variant?: Variant;
  className?: string;
  showKent?: boolean;
  /** Optional area label e.g. station county for copy. */
  areaHint?: string;
}) {
  const needLine = areaHint
    ? `Need a police station representative covering ${areaHint}?`
    : 'Need a police station representative or agency cover?';

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
        <Link
          href={INSTRUCT_PRIMARY_HREF}
          className="inline-flex min-h-[2.5rem] items-center rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-extrabold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
          data-event="instruct_cta_click"
          data-event-placement="inline"
        >
          {INSTRUCT_PRIMARY_LABEL}
        </Link>
        {showKent ? (
          <Link
            href={INSTRUCT_KENT_HREF}
            className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-sm font-semibold text-white no-underline hover:border-[var(--gold)] hover:bg-white/15"
          >
            {INSTRUCT_KENT_LABEL}
          </Link>
        ) : null}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={INSTRUCT_PRIMARY_HREF}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[var(--gold)] px-6 text-base font-extrabold text-[var(--navy)] no-underline shadow-md hover:bg-[var(--gold-hover)]"
            data-event="instruct_cta_click"
            data-event-placement="hero"
          >
            {INSTRUCT_PRIMARY_LABEL}
          </Link>
          {showKent ? (
            <Link
              href={INSTRUCT_KENT_HREF}
              className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-white/40 bg-white/10 px-5 text-sm font-bold text-white no-underline hover:border-[var(--gold)] hover:bg-white/15"
            >
              {INSTRUCT_KENT_LABEL}
            </Link>
          ) : null}
        </div>
        <Link
          href={INSTRUCT_CONTACT_HREF}
          className="text-sm font-semibold text-white/80 underline-offset-2 hover:text-[var(--gold)] hover:underline"
        >
          {INSTRUCT_CONTACT_LABEL} →
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-[var(--navy)]/15 bg-gradient-to-br from-[var(--gold-pale)] to-white p-5 text-center shadow-sm sm:p-6 ${className ?? ''}`}
    >
      <h2 className="text-lg font-extrabold text-[var(--navy)] sm:text-xl">{needLine}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
        Search accredited reps by county or station and instruct them directly. For Kent overflow
        cover, use the Kent agency cover guide or contact the directory team.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={INSTRUCT_PRIMARY_HREF}
          className="btn-gold inline-flex !text-sm !no-underline"
          data-event="instruct_cta_click"
          data-event-placement="panel"
        >
          {INSTRUCT_PRIMARY_LABEL}
        </Link>
        {showKent ? (
          <Link
            href={INSTRUCT_KENT_HREF}
            className="inline-flex min-h-[2.5rem] items-center rounded-lg border-2 border-[var(--navy)]/15 px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold-hover)]"
          >
            {INSTRUCT_KENT_LABEL}
          </Link>
        ) : null}
        <Link
          href={INSTRUCT_CONTACT_HREF}
          className="inline-flex min-h-[2.5rem] items-center rounded-lg border-2 border-[var(--navy)]/15 px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold-hover)]"
        >
          {INSTRUCT_CONTACT_LABEL}
        </Link>
      </div>
    </div>
  );
}
