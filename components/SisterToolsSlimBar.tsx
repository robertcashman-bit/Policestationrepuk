import Link from 'next/link';
import { PartnerOutboundLink } from '@/components/PartnerOutboundLink';
import {
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';
import {
  PSRTRAIN_CTA,
  PSRTRAIN_NAME,
  PSRTRAIN_TRAINING_HREF,
} from '@/lib/psrtrain-promo';

/**
 * One slim sister-product bar — Custody Note + PSR Train (+ optional directory link).
 * Must not dominate the first screen; keep to a single horizontal strip.
 */
export function SisterToolsSlimBar({
  showDirectoryLink = false,
  className = '',
}: {
  showDirectoryLink?: boolean;
  className?: string;
}) {
  return (
    <aside
      className={`border-b border-[var(--border)] bg-slate-50 ${className}`}
      aria-label="Related tools"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-xs sm:px-6 lg:px-8 sm:justify-between">
        <p className="font-semibold text-[var(--muted)]">Also from this network</p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:gap-x-4">
          {showDirectoryLink && (
            <Link
              href="/directory"
              className="font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-link)]"
            >
              Directory
            </Link>
          )}
          <PartnerOutboundLink
            href={CUSTODYNOTE_TRIAL_HREF}
            partner="custodynote"
            placement="sister_slim_bar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-link)]"
          >
            {CUSTODYNOTE_BRAND_NAME}
          </PartnerOutboundLink>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <PartnerOutboundLink
            href={PSRTRAIN_TRAINING_HREF}
            partner="psrtrain"
            placement="sister_slim_bar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-link)]"
          >
            {PSRTRAIN_NAME} — {PSRTRAIN_CTA}
          </PartnerOutboundLink>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link
            href="/KentAgentCover"
            className="font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-link)]"
          >
            Kent agent cover
          </Link>
        </div>
      </div>
    </aside>
  );
}
