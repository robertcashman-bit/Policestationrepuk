import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'ICO Registration & Data Controller Statement',
  description:
    'ICO registration details for Defence Legal Services Ltd trading as PoliceStationRepUK. Data controller information and how to exercise UK GDPR rights.',
  path: '/ICO',
});

export default function ICOPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'ICO statement' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">ICO registration</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Defence Legal Services Ltd (PoliceStationRepUK) is registered with the Information Commissioner&apos;s Office
            (ICO) as a data controller. Last updated: 8 March 2026.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">1. Registration details</h2>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-[var(--muted)] leading-relaxed">
              <p>
                <strong className="text-[var(--navy)]">Registration number:</strong> ZA198500
              </p>
              <p className="mt-2">
                <strong className="text-[var(--navy)]">Organisation:</strong> Defence Legal Services Ltd
              </p>
              <p className="mt-2">
                <strong className="text-[var(--navy)]">Registered address:</strong> Greenacre, London Road, West
                Kingsdown, Sevenoaks, Kent, TN15 6ER
              </p>
            </div>
            <p className="text-[var(--muted)] leading-relaxed">
              Our ICO registration covers processing necessary to operate the directory and related services, including:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>Professional directory listings and account management</li>
              <li>Marketing and advertising where applicable</li>
              <li>Staff administration</li>
              <li>Accounts and records</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">2. Verify our registration</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Search the ICO register for registration number{' '}
              <strong className="text-[var(--navy)]">ZA198500</strong> or organisation name{' '}
              <strong className="text-[var(--navy)]">Defence Legal Services Ltd</strong>.
            </p>
            <p>
              <a
                href="https://ico.org.uk/for-the-public/"
                className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                ICO website — verify registration →
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">3. Your rights (UK GDPR)</h2>
            <p className="text-[var(--muted)] leading-relaxed">You may have the right to:</p>
            <ul className="list-disc space-y-1 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>Be informed about processing</li>
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request erasure in certain cases</li>
              <li>Restrict processing in certain cases</li>
              <li>Data portability where applicable</li>
              <li>Object to processing based on legitimate interests</li>
              <li>Not be subject solely to automated decision-making in relevant circumstances</li>
            </ul>
            <p className="text-[var(--muted)] leading-relaxed">
              Full detail: see our{' '}
              <Link href="/Privacy" className="font-semibold text-[var(--navy)] underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">4. Raise a concern</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              <strong className="text-[var(--navy)]">Step 1 — contact us first</strong>
            </p>
            <p className="text-[var(--muted)] leading-relaxed">
              Email{' '}
              <a
                href="mailto:robertcashman@defencelegalservices.co.uk?subject=Data%20protection%20concern"
                className="font-semibold text-[var(--navy)] underline"
              >
                robertcashman@defencelegalservices.co.uk
              </a>{' '}
              with subject line &quot;Data protection concern&quot;. We aim to respond within five working days and resolve
              issues within one month where reasonable.
            </p>
            <p className="text-[var(--muted)] leading-relaxed">
              <strong className="text-[var(--navy)]">Step 2 — ICO complaint</strong>
            </p>
            <p className="text-[var(--muted)] leading-relaxed">
              If you remain dissatisfied, you may complain to the ICO:{' '}
              <a
                href="https://ico.org.uk/make-a-complaint/"
                className="font-semibold text-[var(--navy)] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                ico.org.uk/make-a-complaint
              </a>
              {' · '}
              Helpline 0303 123 1113 (Mon–Fri, 9am–5pm).
            </p>
            <p className="text-sm text-[var(--muted)]">
              Include our organisation name, ICO registration number, and what you have already raised with us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">5. Our commitment</h2>
            <ul className="list-disc space-y-1 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>Maintain ICO registration and cooperate with the ICO</li>
              <li>Implement recommendations promptly where applicable</li>
              <li>Improve data protection practices over time</li>
            </ul>
            <p className="text-[var(--muted)] leading-relaxed">
              See also{' '}
              <Link href="/Privacy" className="font-semibold text-[var(--navy)] underline">
                Privacy
              </Link>
              ,{' '}
              <Link href="/GDPR" className="font-semibold text-[var(--navy)] underline">
                GDPR
              </Link>
              , and{' '}
              <Link href="/DataProtection" className="font-semibold text-[var(--navy)] underline">
                Data protection
              </Link>{' '}
              pages where published on this site.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Site navigation</h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Directory
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
