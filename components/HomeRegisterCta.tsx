import Link from 'next/link';

export function HomeRegisterCta() {
  return (
    <section className="section-pad bg-gradient-to-br from-emerald-600 to-emerald-700" aria-label="Join directory call to action">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-h2 mt-0 text-white">
            Join the Directory — it&apos;s free
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100">
            Get discovered by criminal defence firms and receive more opportunities.
          </p>
          <p className="mt-2 text-sm text-emerald-200">
            Takes 2–3 minutes • No fees, ever
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/register" className="flex w-full min-h-[44px] items-center justify-center rounded-[var(--radius-lg)] bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-md no-underline transition-colors hover:bg-emerald-50 sm:w-auto">
              Create My Free Profile
            </Link>
            <Link href="/directory" className="flex w-full min-h-[44px] items-center justify-center rounded-[var(--radius-lg)] border border-white/35 px-6 py-3 text-sm font-bold text-white no-underline transition-colors hover:border-white hover:bg-white/10 sm:w-auto">
              Search Directory
            </Link>
            <Link href="/StationsDirectory" className="flex w-full min-h-[44px] items-center justify-center rounded-[var(--radius-lg)] border border-white/35 px-6 py-3 text-sm font-bold text-white no-underline transition-colors hover:border-white hover:bg-white/10 sm:w-auto">
              Station Numbers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
