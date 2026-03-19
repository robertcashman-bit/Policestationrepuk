export function HomeKentSpotlight() {
  return (
    <section className="bg-[var(--gold-pale)] py-14 sm:py-16">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">
            Need a Police Station Rep in Kent?
          </h3>
          <p className="mt-2 text-sm font-medium text-[var(--muted)]">
            Duty Solicitor • 24/7 Immediate Coverage • All Kent stations
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="tel:01732247427"
              className="btn-gold !text-sm"
            >
              📞 (01732) 247427
            </a>
            <a
              href="sms:07535494446"
              className="btn-outline !text-sm"
            >
              💬 Send SMS to 07535 494446
            </a>
          </div>
          <button
            className="mt-4 text-sm font-medium text-[var(--gold-hover)] hover:text-[var(--gold)]"
          >
            Show details
          </button>
        </div>
      </div>
    </section>
  );
}
