import Link from 'next/link';

export function HomeRegisterCta() {
  return (
    <section className="bg-[var(--navy)] py-16 sm:py-20">
      <div className="page-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-h2 !mt-0 text-white">Are you a police station representative?</h2>
          <p className="mt-4 text-lg text-slate-300">
            Join our free directory and connect with criminal defence solicitors looking for
            police station cover across England &amp; Wales. No fees, no subscriptions — ever.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="btn-gold w-full sm:w-auto">
              Register for Free
            </Link>
            <Link
              href="/GoFeatured"
              className="btn-outline w-full !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] sm:w-auto"
            >
              Become Featured
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            No subscriptions, no hidden costs — create your free profile in minutes
          </p>
        </div>
      </div>
    </section>
  );
}
