import Link from 'next/link';

export function HomeCustodyNote() {
  return (
    <section className="section-pad bg-[var(--navy)]" aria-label="Custody Note promotion">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-h2 mt-0 text-white">Custody Note</h2>
          <p className="mt-1 text-sm font-medium text-cyan-100">Desktop software for police station attendance notes</p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white">
            Built for freelance police station representatives and criminal solicitors. Structured
            attendance notes, telephone advice records, time recording, firm billing, and PDF export
            in one Windows app that still works when signal is poor.
          </p>

          <div className="mt-6 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-black/25 px-5 py-2.5 text-sm font-semibold text-white">
            <span aria-hidden>🎁</span>
            Exclusive for PSR UK members — 25% off your subscription
          </div>

          <p className="mt-3 text-sm font-medium text-white">
            Use code <span className="rounded bg-[var(--navy-light)] px-2 py-0.5 font-mono font-bold text-white">A2MJY2NQ</span> at
            checkout on custodynote.com
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="https://custodynote.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold w-full sm:w-auto"
            >
              Start 30-Day Free Trial
            </Link>
            <Link
              href="https://custodynote.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full !border-slate-500 !text-white hover:!border-cyan-400 hover:!text-cyan-400 sm:w-auto"
            >
              Visit custodynote.com →
            </Link>
          </div>

          <p className="mt-5 text-xs text-white">
            No credit card for trial · Windows 10+ · From £9.99/mo · Cancel any time
          </p>
        </div>
      </div>
    </section>
  );
}
