import Link from 'next/link';

/** Soft Kent directory nudge for FAQ/PACE pages — RepUK acquisition, not PSA sell. */
export function PoliceStationAgentKentCta({ className, linkClassName }: {
  className?: string;
  linkClassName?: string;
  placement?: string;
}) {
  return (
    <p className={className}>
      Looking for Kent police station cover?{' '}
      <Link
        href="/directory/kent"
        className={
          linkClassName ??
          'font-semibold text-[var(--gold-link)] underline underline-offset-2 hover:text-[var(--gold)]'
        }
      >
        Browse Kent reps in the free directory
      </Link>
      .
    </p>
  );
}
