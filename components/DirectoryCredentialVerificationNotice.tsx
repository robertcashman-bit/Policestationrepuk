import Link from 'next/link';

/**
 * Shown wherever rep listings appear: instructing firms should verify accreditation
 * (e.g. LCCSA / CLSA membership evidence) and report suspected misrepresentation.
 */
export function DirectoryCredentialVerificationNotice({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3.5 text-sm leading-relaxed text-amber-950 shadow-sm sm:px-5 sm:py-4 ${className}`}
      aria-label="Verify representative accreditation"
    >
      <p className="font-semibold text-amber-950">Verify suitability and accreditation before instructing</p>
      <p className="mt-2 text-amber-950/95">
        You should always satisfy yourself that a representative is{' '}
        <strong className="font-semibold">appropriately qualified</strong> for your instruction. Before relying on a
        listing, consider asking for <strong className="font-semibold">current membership or accreditation evidence</strong>{' '}
        — for example a valid <abbr title="London Criminal Courts Solicitors Association">LCCSA</abbr> or{' '}
        <abbr title="Criminal Law Solicitors Association">CLSA</abbr> card (or other accreditation relevant to the role)
        — and follow your firm&apos;s own checks and record-keeping.
      </p>
      <p className="mt-2 text-amber-950/95">
        If you have reason to believe someone is{' '}
        <strong className="font-semibold">misrepresenting their qualification</strong> as an accredited police station
        representative, please{' '}
        <Link href="/Contact" className="font-semibold text-amber-950 underline decoration-amber-700/60 underline-offset-2 hover:text-amber-900">
          report it to us
        </Link>
        . We review concerns professionally and will take <strong className="font-semibold">appropriate action</strong>{' '}
        where misuse of the directory or false credentials is substantiated.
      </p>
    </aside>
  );
}
