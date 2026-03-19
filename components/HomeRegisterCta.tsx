import Link from 'next/link';

export function HomeRegisterCta() {
  return (
    <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 py-14 sm:py-16" aria-label="Join directory call to action">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Join the Directory — it&apos;s free
          </h2>
          <p className="mt-3 text-emerald-100">
            Get discovered by criminal defence firms and receive more opportunities.
          </p>
          <p className="mt-2 text-sm text-emerald-200">
            Takes 2–3 minutes • No fees, ever
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="flex w-full items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-emerald-700 shadow-lg no-underline transition-all hover:bg-emerald-50 sm:w-auto">
              Create My Free Profile
            </Link>
            <Link href="/directory" className="flex w-full items-center justify-center rounded-xl border-2 border-white/30 px-8 py-4 text-base font-bold text-white no-underline transition-all hover:border-white hover:bg-white/10 sm:w-auto">
              Search Directory
            </Link>
            <Link href="/StationsDirectory" className="flex w-full items-center justify-center rounded-xl border-2 border-white/30 px-8 py-4 text-base font-bold text-white no-underline transition-all hover:border-white hover:bg-white/10 sm:w-auto">
              Station Numbers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
