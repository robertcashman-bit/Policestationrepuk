import type { ReactNode } from 'react';
import {
  CUSTODYNOTE_MAC_DOWNLOAD_CTA,
  CUSTODYNOTE_MAC_DOWNLOAD_HREF,
  CUSTODYNOTE_STORE_CTA,
  custodyNoteStoreUrl,
} from '@/lib/custodynote-promo';

type Size = 'hero' | 'lg' | 'md' | 'sm';

const sizeClass: Record<Size, string> = {
  hero:
    'min-h-[56px] gap-3 rounded-xl px-6 py-3.5 text-base sm:min-h-[60px] sm:px-8 sm:text-lg',
  lg: 'min-h-[48px] gap-2.5 rounded-xl px-6 py-3 text-base',
  md: 'min-h-[44px] gap-2 rounded-lg px-5 py-2.5 text-sm',
  sm: 'min-h-[40px] gap-2 rounded-lg px-4 py-2 text-xs',
};

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3 3h8.5v8.5H3V3zm9.5 0H21v8.5h-8.5V3zM3 12.5H11.5V21H3v-8.5zm9.5 0H21V21h-8.5v-8.5z" />
    </svg>
  );
}

function MacIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 15.84 3.18 10.14 5.22 6.91c1.01-1.61 2.61-2.63 4.19-2.66 1.29-.02 2.51.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.22-1.98 1.09-3.13-1.05.04-2.32.71-3.08 1.59-.67.76-1.26 1.98-1.1 3.14 1.17.09 2.36-.66 3.09-1.6z" />
    </svg>
  );
}

/**
 * Primary Windows install CTA — visually dominant Microsoft Store button/badge.
 * Use for Custody Note promo surfaces. Mac is never claimed to be on the Store.
 */
export function MicrosoftStoreCta({
  placement,
  size = 'md',
  className = '',
  label = CUSTODYNOTE_STORE_CTA,
  href,
  showIcon = true,
}: {
  /** Campaign placement slug → cid=repuk-<placement> (e.g. home, nav, footer). */
  placement: string;
  size?: Size;
  className?: string;
  label?: string;
  href?: string;
  showIcon?: boolean;
}) {
  const resolvedHref = href ?? custodyNoteStoreUrl(placement);
  return (
    <a
      href={resolvedHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center bg-[var(--gold)] font-extrabold tracking-tight text-[var(--navy)] no-underline shadow-[0_4px_14px_-2px_rgba(250,204,21,0.45)] transition-colors hover:bg-[var(--gold-hover)] ${sizeClass[size]} ${className}`}
    >
      {showIcon ? <StoreIcon className="shrink-0" /> : null}
      <span>
        {label}
        <span aria-hidden> →</span>
      </span>
    </a>
  );
}

/**
 * Dedicated Mac install CTA — notarised .dmg direct download (not Mac App Store).
 * Show as a peer button alongside MicrosoftStoreCta on multi-CTA surfaces.
 */
export function MacDownloadCta({
  size = 'md',
  className = '',
  label = CUSTODYNOTE_MAC_DOWNLOAD_CTA,
  href = CUSTODYNOTE_MAC_DOWNLOAD_HREF,
  showIcon = true,
  /** Dark navy surfaces use a light outline; light surfaces use navy outline. */
  tone = 'onDark',
}: {
  size?: Size;
  className?: string;
  label?: string;
  href?: string;
  showIcon?: boolean;
  tone?: 'onDark' | 'onLight';
}) {
  const toneClass =
    tone === 'onLight'
      ? 'border-2 border-[var(--navy)] bg-white text-[var(--navy)] hover:border-[var(--gold)] hover:bg-[var(--gold-pale)]'
      : 'border-2 border-white/70 bg-white/10 text-white hover:border-[var(--gold)] hover:bg-white/15 hover:text-[var(--gold)]';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center font-extrabold tracking-tight no-underline transition-colors ${toneClass} ${sizeClass[size]} ${className}`}
    >
      {showIcon ? <MacIcon className="shrink-0" /> : null}
      <span>
        {label}
        <span aria-hidden> →</span>
      </span>
    </a>
  );
}

/** Secondary / backup Windows direct-download link — never styled as a peer primary button. */
export function CustodyNoteDownloadLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-sm font-medium underline underline-offset-2 transition-colors hover:opacity-90 ${className}`}
    >
      {children}
    </a>
  );
}
