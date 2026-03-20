export function HomeKentSpotlight() {
  return (
    <section className="section-pad bg-[var(--gold-pale)]">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-h3 mt-0 text-[var(--navy)]">
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
        </div>
      </div>
    </section>
  );
}
