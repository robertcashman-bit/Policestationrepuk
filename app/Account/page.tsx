import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({
  title: 'Account — Manage Your PoliceStationRepUK Profile',
  description:
    'Manage your PoliceStationRepUK directory profile. Update availability, contact details, and coverage areas. New representatives can register for a free listing in minutes.',
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
          Manage your directory listing or register for a free profile.
        </p>
      </div>
    </section>

    <div className="page-container">
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            COMING SOON
          </div>
          <h2 className="text-lg font-bold text-[var(--navy)]">Self-service login</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            We are building a self-service portal so you can update your profile, availability, and
            contact details directly. In the meantime, request any changes through our team.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/Contact" className="btn-gold inline-block !text-sm">
              Request changes
            </Link>
            <Link
              href="/Profile"
              className="inline-block text-sm font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2"
            >
              My Profile →
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--navy)]">New to the directory?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Create a free accredited rep profile so firms and solicitors can find you.
            </p>
            <Link href="/register" className="btn-gold mt-4 inline-block !text-sm">
              Register free
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--gold-pale)] p-6">
            <h2 className="text-lg font-bold text-[var(--navy)]">Already listed?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Request changes, featured placement, or help from the team — all free.
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
