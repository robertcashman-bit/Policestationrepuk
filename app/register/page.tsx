import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RegisterForm } from './RegisterForm';

export const metadata = buildMetadata({
  title: 'Register as a Police Station Representative',
  description:
    'Register with the PoliceStationRepUK directory. Free for accredited police station representatives. Connect with criminal solicitors seeking cover across England and Wales.',
  path: '/register',
});

export default function RegisterPage() {
  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Register' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">
            Register as a Police Station Representative
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Join our free directory. Connect with criminal defence firms and solicitors seeking cover across England and Wales.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-2xl">
          {/* Trust badges */}
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              ✓ Free to register
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              ✓ Listed within 24 hours
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              ✓ No hidden fees
            </span>
          </div>

          {/* Form card */}
          <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
            <RegisterForm />
          </div>

          {/* What happens next */}
          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--gold-pale)] p-6">
            <h2 className="text-base font-bold text-[var(--navy)]">What happens after you register?</h2>
            <ol className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--navy)]">1</span>
                We review your details within 24 hours
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--navy)]">2</span>
                Your profile is published in the directory
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--navy)]">3</span>
                Solicitors and firms can find and contact you directly
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
