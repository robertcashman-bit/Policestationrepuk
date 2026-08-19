'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PartnerOutboundLink } from '@/components/PartnerOutboundLink';
import {
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_BETA_REASON,
  CUSTODYNOTE_PROMO_PRICE_LINE,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';
import { WHATSAPP_BANNER_QUALIFICATION } from '@/lib/community-messaging';
import { WHATSAPP_JOIN_PHONE, WHATSAPP_JOIN_URL } from '@/lib/site-navigation';
import {
  PSRTRAIN_CTA,
  PSRTRAIN_FREE_TESTING_NOTE,
  PSRTRAIN_NAME,
  PSRTRAIN_TRAINING_HREF,
} from '@/lib/psrtrain-promo';

/**
 * Global promos: CustodyNote, directory/Kent, WhatsApp, PSR Train.
 * Hidden on `/` — the homepage already has fuller versions.
 * PSA agent-cover hard-sell removed — RepUK directory acquisition first.
 */
export function SiteWidePromoStrip() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <aside
      className="border-t border-[var(--border)] bg-gradient-to-b from-slate-50 to-white"
      aria-label="Featured services and community"
    >
      <div className="page-container py-6 sm:py-8 lg:py-10">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--muted)]">
          Directory, tools &amp; community
        </p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--navy)]/20 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--navy)]">Directory</p>
            <h2 className="mt-1 text-base font-extrabold text-[var(--navy)]">Find a police station rep</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--muted)]">
              Free UK directory of accredited representatives. Search by county or station and contact reps
              directly.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/directory"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-[var(--navy)] px-3 text-xs font-bold text-white no-underline hover:bg-[var(--navy-light)]"
              >
                Browse directory
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
              >
                Join free
              </Link>
            </div>
          </div>

          <div className="flex flex-col rounded-[var(--radius-lg)] border border-emerald-800/25 bg-gradient-to-b from-emerald-950 to-[#0a1f1a] p-5 text-white shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Community</p>
            <h2 className="mt-1 text-base font-extrabold">WhatsApp group</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-emerald-100/90">
              One group for fully accredited reps &amp; verified firms. Text{' '}
              <span className="font-semibold text-white">{WHATSAPP_JOIN_PHONE}</span> —{' '}
              {WHATSAPP_BANNER_QUALIFICATION.toLowerCase()}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={WHATSAPP_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-[var(--gold)] px-3 text-xs font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
              >
                Text to join
              </a>
              <Link
                href="/whatsapp"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-white/20 px-3 text-xs font-semibold text-white no-underline hover:bg-white/10"
              >
                How to join
              </Link>
            </div>
          </div>

          <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--gold)]/40 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--navy)]">Featured product</p>
            <h2 className="mt-1 text-base font-extrabold text-[var(--navy)]">{CUSTODYNOTE_BRAND_NAME}</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--muted)]">
              PACE-aligned attendance notes — offline at the custody desk, PDF for the file.
            </p>
            <p className="mt-3 text-xs font-semibold text-[var(--navy)]">
              {CUSTODYNOTE_PROMO_PRICE_LINE} — {CUSTODYNOTE_BETA_REASON}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PartnerOutboundLink
                href={CUSTODYNOTE_TRIAL_HREF}
                partner="custodynote"
                placement="site_wide_strip_trial"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-[var(--gold)] px-3 text-xs font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
              >
                Download free
              </PartnerOutboundLink>
              <Link
                href="/custodynote"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
              >
                See how it works
              </Link>
            </div>
          </div>

          <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--navy)]/20 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--navy)]">Partner — exam prep</p>
            <h2 className="mt-1 text-base font-extrabold text-[var(--navy)]">{PSRTRAIN_NAME}</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--muted)]">
              Timed MCQs, PACE modules, and CIT-style scenarios for PSRAS candidates.
            </p>
            <p className="mt-2 text-[11px] font-medium text-emerald-700">{PSRTRAIN_FREE_TESTING_NOTE}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PartnerOutboundLink
                href={PSRTRAIN_TRAINING_HREF}
                partner="psrtrain"
                placement="site_wide_strip_training"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-[var(--navy)] px-3 text-xs font-bold text-white no-underline hover:bg-[var(--navy-light)]"
              >
                {PSRTRAIN_CTA}
              </PartnerOutboundLink>
              <Link
                href="/prepareforcit"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
              >
                CIT guide
              </Link>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
