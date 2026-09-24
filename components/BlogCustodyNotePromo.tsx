import Link from 'next/link';
import {
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_FREE_LABEL,
  CUSTODYNOTE_BETA_REASON,
  CUSTODYNOTE_MAC_DOWNLOAD_CTA,
  CUSTODYNOTE_MAC_DOWNLOAD_HREF,
  custodyNoteStoreUrl,
} from '@/lib/custodynote-promo';
import { MacDownloadCta, MicrosoftStoreCta } from '@/components/MicrosoftStoreCta';

/** Internal + trial links for every blog article (conversion funnel). */
export function BlogCustodyNotePromo({ className }: { className?: string }) {
  return (
    <aside
      className={`rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/35 bg-gradient-to-br from-[var(--navy)] to-[#152e6e] p-6 text-white shadow-lg sm:p-8 ${className ?? 'mt-10'}`}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Tool for reps</p>
      <h2 className="mt-2 text-lg font-bold leading-snug sm:text-xl">
        Stop rewriting custody notes at 2am —{' '}
        <Link href="/CustodyNote" className="text-[var(--gold)] underline-offset-2 hover:underline">
          {CUSTODYNOTE_BRAND_NAME}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-200">
        PACE-aligned structured sections, offline-first at the custody desk, instant PDF export and
        LAA billing fields in one record. See our{' '}
        <Link href="/CustodyNote" className="font-semibold text-white underline hover:text-[var(--gold)]">
          {CUSTODYNOTE_BRAND_NAME} overview
        </Link>
        , get it on the{' '}
        <a
          href={custodyNoteStoreUrl('blog')}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--gold)] underline hover:text-white"
        >
          Microsoft Store
        </a>
        {' '}(Windows), or{' '}
        <a
          href={CUSTODYNOTE_MAC_DOWNLOAD_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--gold)] underline hover:text-white"
        >
          {CUSTODYNOTE_MAC_DOWNLOAD_CTA}
        </a>
        . {CUSTODYNOTE_FREE_LABEL}. Built for accredited UK police station representatives and defence solicitors.
      </p>

      <div className="mt-4 rounded-lg border border-[var(--gold)]/40 bg-black/20 px-4 py-3 text-sm text-white">
        <span className="font-bold text-white">{CUSTODYNOTE_FREE_LABEL}</span>
        <span className="mx-2 text-white/40">·</span>
        <span className="text-slate-200">{CUSTODYNOTE_BETA_REASON}</span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <MicrosoftStoreCta placement="blog" size="md" />
        <MacDownloadCta size="md" />
        <Link
          href="/CustodyNote"
          className="text-sm font-semibold text-white underline underline-offset-2"
        >
          See how it works
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        <span className="font-medium text-slate-300">Advertisement.</span> {CUSTODYNOTE_BRAND_NAME} is a product of Defence Legal
        Services Ltd.{' '}
        <Link href="/Advertising" className="text-[var(--gold)] underline hover:text-white">
          Advertising disclosure
        </Link>
      </p>
    </aside>
  );
}
