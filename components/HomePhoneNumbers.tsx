import Link from 'next/link';

export function HomePhoneNumbers() {
  return (
    <section className="section-pad bg-white" aria-label="Police station contacts">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-h3 mt-0 text-[var(--navy)]">
            Need police station phone numbers?
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Find official phone numbers, addresses and custody contact details across England &amp; Wales.
          </p>

          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/StationsDirectory" className="btn-gold w-full sm:w-auto">
              Station Numbers
            </Link>
            <Link href="/Forces" className="btn-outline w-full sm:w-auto">
              Browse by Force
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
