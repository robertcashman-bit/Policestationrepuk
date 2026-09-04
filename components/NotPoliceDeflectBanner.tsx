import Link from 'next/link';
import {
  NOT_POLICE_BODY,
  NOT_POLICE_HEADLINE,
  NOT_POLICE_SHORT,
} from '@/lib/gsc-harness-copy';

type Variant = 'full' | 'compact' | 'hero';

/**
 * Deflects Search Console “custody suite phone number” traffic that lands here
 * expecting a police switchboard. Keep on homepage, station, and directory hubs.
 */
export function NotPoliceDeflectBanner({
  variant = 'full',
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === 'compact') {
    return (
      <aside
        role="note"
        className={`rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 ${className ?? ''}`}
      >
        <strong className="font-extrabold">{NOT_POLICE_HEADLINE}.</strong> {NOT_POLICE_SHORT}{' '}
        <Link href="/Contact" className="font-semibold underline underline-offset-2">
          Directory contact
        </Link>
      </aside>
    );
  }

  if (variant === 'hero') {
    return (
      <aside
        role="note"
        className={`rounded-xl border border-white/25 bg-black/25 px-4 py-3 text-left text-sm leading-relaxed text-white/95 backdrop-blur-sm ${className ?? ''}`}
      >
        <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--gold)]">
          {NOT_POLICE_HEADLINE}
        </p>
        <p className="mt-1 text-sm text-white/90">{NOT_POLICE_BODY}</p>
        <p className="mt-2 text-xs text-white/75">
          Emergency:{' '}
          <a href="tel:999" className="font-bold text-white underline">
            999
          </a>
          {' · '}
          Non-emergency:{' '}
          <a href="tel:101" className="font-bold text-white underline">
            101
          </a>
        </p>
      </aside>
    );
  }

  return (
    <aside
      role="note"
      className={`rounded-xl border-2 border-red-600 bg-red-50 px-4 py-4 text-sm leading-relaxed text-red-950 sm:px-5 sm:py-5 ${className ?? ''}`}
    >
      <p className="text-base font-extrabold uppercase tracking-wide text-red-800 sm:text-lg">
        {NOT_POLICE_HEADLINE}
      </p>
      <p className="mt-2">{NOT_POLICE_BODY}</p>
      <ul className="mt-3 space-y-1 text-sm">
        <li>
          <strong>Emergency:</strong>{' '}
          <a href="tel:999" className="font-bold text-red-900 underline">
            999
          </a>
        </li>
        <li>
          <strong>Non-emergency:</strong>{' '}
          <a href="tel:101" className="font-bold text-red-900 underline">
            101
          </a>
        </li>
      </ul>
    </aside>
  );
}
