import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import Link from 'next/link';

export const metadata = buildMetadata({
  title: 'My Profile — PoliceStationRepUK',
  description:
    'Manage your PoliceStationRepUK directory listing. Update your details, become featured, or register for a free profile.',
  path: '/Profile',
});

export default function ProfilePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'My Profile' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">My Profile</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Manage your free listing, upgrade visibility, or create a profile if you are new to the directory.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--navy)]">Already registered?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Directory updates are handled through our registration flow and support team. Use the options below
              to get help or refresh your details.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/Contact" className="btn-gold !text-center !text-sm">
                Request a profile update
              </Link>
              <Link
                href="/GoFeatured"
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
              >
                Become featured
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--navy)]">New to the directory?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Create your free accredited rep listing in a few minutes — no subscription fees.
            </p>
            <Link href="/Register" className="btn-gold mt-4 inline-block !text-sm">
              Join the directory (free)
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
