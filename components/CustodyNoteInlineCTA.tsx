'use client';

import Link from 'next/link';
import {
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_APPS_LINE,
  CUSTODYNOTE_DOWNLOAD_CTA,
  CUSTODYNOTE_DOWNLOAD_HREF,
  CUSTODYNOTE_BETA_REASON,
  CUSTODYNOTE_FREE_LABEL,
  INLINE_CTA_BULLETS,
  INLINE_CTA_HEADLINE,
} from '@/lib/custodynote-promo';
import {
  CustodyNoteDownloadLink,
  MacDownloadCta,
  MicrosoftStoreCta,
} from '@/components/MicrosoftStoreCta';

type Variant = 'full' | 'compact';

export function CustodyNoteInlineCTA({ variant = 'full' }: { variant?: Variant }) {
  if (variant === 'compact') {
    return (
      <aside className="rounded-xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--navy)] to-[#152e6e] p-4 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">{CUSTODYNOTE_BRAND_NAME}</p>
        <p className="mt-1 text-xs font-medium text-[var(--gold)]">{CUSTODYNOTE_APPS_LINE}</p>
        <p className="mt-1 text-sm font-semibold leading-snug">{INLINE_CTA_HEADLINE}</p>
        <ul className="mt-2 space-y-0.5 text-xs text-slate-200">
          {INLINE_CTA_BULLETS.map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <span className="text-[var(--gold)]" aria-hidden>
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-white/85">
          {CUSTODYNOTE_FREE_LABEL} · Windows PC &amp; Mac · {CUSTODYNOTE_BETA_REASON}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <MicrosoftStoreCta size="sm" className="w-full" />
          <MacDownloadCta size="sm" className="w-full" />
          <div className="flex flex-wrap gap-2">
            <CustodyNoteDownloadLink href={CUSTODYNOTE_DOWNLOAD_HREF} className="text-xs text-white/90">
              {CUSTODYNOTE_DOWNLOAD_CTA} (Windows backup)
            </CustodyNoteDownloadLink>
            <Link href="/CustodyNote" className="text-xs font-semibold text-white/90 underline underline-offset-2">
              About {CUSTODYNOTE_BRAND_NAME}
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="relative overflow-hidden rounded-2xl border-2 border-[var(--gold)]/50 bg-gradient-to-br from-[#0f1d45] via-[var(--navy)] to-[#0a1633] p-6 shadow-[0_20px_50px_-12px_rgba(30,58,138,0.45)] sm:p-8"
      aria-labelledby="cn-inline-cta-heading"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--gold)]/10 blur-2xl" />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Recommended for reps</p>
        <p className="mt-2 text-sm font-medium text-[var(--gold)]">{CUSTODYNOTE_APPS_LINE}</p>
        <h2 id="cn-inline-cta-heading" className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {INLINE_CTA_HEADLINE}
        </h2>
        <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
          {INLINE_CTA_BULLETS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/20 text-[var(--gold)]"
                aria-hidden
              >
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-lg border border-[var(--gold)]/30 bg-black/20 px-3 py-2 text-xs text-white sm:text-sm">
          <span className="font-bold">{CUSTODYNOTE_FREE_LABEL}</span>
          <span className="mx-2 text-white/40">·</span>
          <span className="text-white/90">{CUSTODYNOTE_BETA_REASON}</span>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <MicrosoftStoreCta size="lg" />
          <MacDownloadCta size="lg" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <CustodyNoteDownloadLink href={CUSTODYNOTE_DOWNLOAD_HREF} className="text-white/90">
              {CUSTODYNOTE_DOWNLOAD_CTA} (Windows backup)
            </CustodyNoteDownloadLink>
            <Link href="/CustodyNote" className="text-sm font-semibold text-white/90 underline underline-offset-2">
              See how it works
            </Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Advertisement — {CUSTODYNOTE_BRAND_NAME} is attendance note software by Defence Legal Services Ltd.{' '}
          <Link href="/Advertising" className="text-[var(--gold)] underline underline-offset-2 hover:text-white">
            Disclosure
          </Link>
        </p>
      </div>
    </aside>
  );
}
