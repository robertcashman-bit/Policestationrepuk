import Link from 'next/link';
import { CUSTODYNOTE_TRIAL_HREF } from '@/lib/custodynote-promo';

/** Internal + trial links for every blog article (conversion funnel). */
export function BlogCustodyNotePromo({ className }: { className?: string }) {
  return (
    <aside
      className={`rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/35 bg-gradient-to-br from-[var(--navy)] to-[#152e6e] p-6 text-white shadow-lg sm:p-8 ${className ?? 'mt-10'}`}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Tool for reps</p>
      <h2 className="mt-2 text-lg font-bold leading-snug sm:text-xl">
        Write PACE-aligned custody notes faster —{' '}
        <Link href="/CustodyNote" className="text-[var(--gold)] underline-offset-2 hover:underline">
          CustodyNote
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-200">
        Structured attendance notes, offline-first workflow, and instant PDF output. See our{' '}
        <Link href="/CustodyNote" className="font-semibold text-white underline hover:text-[var(--gold)]">
          CustodyNote overview
        </Link>
        , then start a{' '}
        <a
          href={CUSTODYNOTE_TRIAL_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--gold)] underline hover:text-white"
        >
          free trial on custodynote.com
        </a>
        . UK-compliant templates built for police station representatives.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={CUSTODYNOTE_TRIAL_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
        >
          Start Free Trial
        </a>
        <Link
          href="/CustodyNote"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-white/30 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-white/10"
        >
          Read more on this site
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        <span className="font-medium text-slate-300">Advertisement.</span> CustodyNote is a product of Defence Legal
        Services Ltd.{' '}
        <Link href="/Advertising" className="text-[var(--gold)] underline hover:text-white">
          Advertising disclosure
        </Link>
      </p>
    </aside>
  );
}
