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

          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--background)] p-[var(--card-padding)] shadow-[var(--card-shadow)]">
            <p className="text-sm font-semibold text-[var(--navy)]">Direct Contact</p>
            <div className="mt-3 flex flex-wrap justify-center gap-4">
              <a
                href="tel:01732247427"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--navy)] no-underline hover:text-[var(--gold-hover)]"
              >
                📞 (01732) 247427
              </a>
              <a
                href="sms:07535494446"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--navy)] no-underline hover:text-[var(--gold-hover)]"
              >
                💬 Send SMS to 07535 494446
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
