import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { AccountLoginForm } from './AccountLoginForm';

export const metadata = buildMetadata({
  title: 'Account — PoliceStationRepUK',
  description:
    'Sign in or manage your PoliceStationRepUK directory presence. New representatives can register for a free listing.',
  path: '/Account',
});

export default function AccountPage() {
  return <>
    <section className="bg-[var(--navy)] py-10 sm:py-14">
      <div className="page-container !py-0">
        <Breadcrumbs
          light
          items={[
            { label: 'Home', href: '/' },
            { label: 'Account' },
          ]}
        />
        <h1 className="mt-3 text-h1 text-white">Account</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-300">
          Sign in to manage your directory listing, or go to My Profile for update options while self-service login
          is expanded.
        </p>
      </div>
    </section>

    <div className="page-container">
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--navy)]">Sign in</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Use the email associated with your directory registration.
          </p>
          <AccountLoginForm />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--navy)]">New to the directory?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Create a free accredited rep profile so firms and solicitors can find you.
            </p>
            <Link href="/Register" className="btn-gold mt-4 inline-block !text-sm">
              Register free
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--gold-pale)] p-6">
            <h2 className="text-lg font-bold text-[var(--navy)]">Already listed?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Request changes, featured placement, or help from the team.
            </p>
            <Link
              href="/Profile"
              className="mt-4 inline-block text-sm font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2"
            >
              My Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  </>;
}
