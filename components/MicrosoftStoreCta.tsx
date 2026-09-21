import type { ReactNode } from 'react';
import {
  CUSTODYNOTE_STORE_CTA,
  CUSTODYNOTE_STORE_HREF,
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

/**
 * Primary Windows install CTA — visually dominant Microsoft Store button/badge.
 * Use for Custody Note promo surfaces. Mac is never claimed to be on the Store.
 */
export function MicrosoftStoreCta({
  size = 'md',
  className = '',
  label = CUSTODYNOTE_STORE_CTA,
  href = CUSTODYNOTE_STORE_HREF,
  showIcon = true,
}: {
  size?: Size;
  className?: string;
  label?: string;
  href?: string;
  showIcon?: boolean;
}) {
  return (
    <a
      href={href}
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

/** Secondary / backup direct-download link — never styled as a peer primary button. */
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
