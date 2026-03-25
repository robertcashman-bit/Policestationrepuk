import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <section className="bg-[var(--navy)] py-14 sm:py-20">
        <div className="page-container !py-0 text-center">
          <p className="text-6xl font-black text-white sm:text-8xl">404</p>
          <h1 className="mt-4 text-h1 text-white">Page not found</h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Use the links below to find what you need.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--navy)]">Looking for a representative?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Browse accredited police station representatives by county or use our advanced search.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/directory" className="btn-gold !text-center !text-sm">
                Find a rep
              </Link>
              <Link
                href="/search"
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
              >
                Advanced search
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--navy)]">Quick links</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/Blog', label: 'Blog & Articles' },
                { href: '/register', label: 'Join the Directory' },
                { href: '/StationsDirectory', label: 'Station Numbers' },
                { href: '/FormsLibrary', label: 'Legal Forms' },
                { href: '/Wiki', label: 'Rep Wiki' },
                { href: '/FAQ', label: 'FAQ' },
                { href: '/Contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold-pale)] hover:bg-[var(--gold-pale)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
