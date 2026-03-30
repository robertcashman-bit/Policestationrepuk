import Link from 'next/link';

/** Short directory positioning strip for search/directory/jobs templates. */
export function DirectoryComplianceNotice({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-[var(--muted)] ${className}`}
      aria-label="How the directory works"
    >
      <p>
        <strong className="text-[var(--navy)]">PoliceStationRepUK is a discovery directory</strong>, not a law firm or
        rep agency. Firms may post opportunities; accredited reps may accept work.{' '}
        <strong className="text-[var(--navy)]">The contract is between the instructing firm and the representative.</strong>{' '}
        This site does not supervise case conduct or provide regulated legal services through listings. Firms remain
        responsible for instruction, supervision, insurance checks where required, and regulatory compliance.{' '}
        <Link href="/About" className="font-semibold text-[var(--navy)] underline">
          How it works
        </Link>
        {' · '}
        <Link href="/Advertising" className="font-semibold text-[var(--navy)] underline">
          Advertising disclosure
        </Link>
      </p>
    </aside>
  );
}
