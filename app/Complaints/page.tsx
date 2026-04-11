import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Complaints Procedure — PoliceStationRepUK Directory',
  description:
    'How to make a complaint about the PoliceStationRepUK directory service. Learn about our response process, timelines, and how we handle different complaint types.',
  path: '/Complaints',
});

export default function ComplaintsPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Complaints Procedure' },
            ]}
          />
          <header className="mb-10">
            <h1 className="text-h1 text-white">Complaints Procedure</h1>
            <p className="mt-2 text-sm text-slate-300">Last updated: 4 January 2026</p>
          </header>
        </div>
      </section>

      <div className="page-container">
      <div className="max-w-3xl space-y-10">
        {/* About This Procedure */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">About This Procedure</h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--muted)]">
            PoliceStationRepUK is operated by Defence Legal Services Ltd. This procedure covers
            complaints about:
          </p>
          <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>The directory website and platform
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Inaccurate information in listings
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Data protection concerns
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Customer service or support
            </li>
          </ul>
          <div className="rounded-[var(--radius-lg)] border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm font-semibold text-[var(--navy)]">Important:</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              This procedure does not cover complaints about the conduct or service quality of
              individual representatives. If you have a complaint about a representative&apos;s
              professional conduct, you should contact their supervising firm or the Solicitors
              Regulation Authority (SRA).
            </p>
          </div>
        </section>

        {/* How to Make a Complaint */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">How to Make a Complaint</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            To make a complaint about the directory service, please contact us:
          </p>
          <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <span className="font-semibold text-[var(--navy)]">Email:</span>{' '}
                <a
                  href="mailto:robertcashman@defencelegalservices.co.uk"
                  className="text-[var(--gold-link)] hover:underline"
                >
                  robertcashman@defencelegalservices.co.uk
                </a>
              </li>
            </ul>
          </div>
          <p className="mb-3 text-sm font-semibold text-[var(--navy)]">Please include:</p>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Your name and contact details
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Description of the complaint
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>What you would like us to do to
              resolve it
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Any relevant screenshots or evidence
            </li>
          </ul>
        </section>

        {/* Our Response Process */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Our Response Process</h2>
          <div className="space-y-0">
            {/* Step 1 */}
            <div className="relative flex gap-6 pb-8">
              <div className="absolute left-[1.1875rem] top-10 h-full w-px bg-[var(--border)]" />
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold-hover)] bg-[var(--card-bg)] text-sm font-bold text-[var(--gold-link)]">
                1
              </div>
              <div className="pt-1.5">
                <p className="font-semibold text-[var(--navy)]">
                  Acknowledgement{' '}
                  <span className="font-normal text-[var(--gold-link)]">
                    (within 2 working days)
                  </span>
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  We will acknowledge receipt of your complaint and assign it a reference number.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-6 pb-8">
              <div className="absolute left-[1.1875rem] top-10 h-full w-px bg-[var(--border)]" />
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold-hover)] bg-[var(--card-bg)] text-sm font-bold text-[var(--gold-link)]">
                2
              </div>
              <div className="pt-1.5">
                <p className="font-semibold text-[var(--navy)]">
                  Investigation{' '}
                  <span className="font-normal text-[var(--gold-link)]">
                    (within 7 working days)
                  </span>
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  We will investigate your complaint and gather relevant information.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-6">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold-hover)] bg-[var(--card-bg)] text-sm font-bold text-[var(--gold-link)]">
                3
              </div>
              <div className="pt-1.5">
                <p className="font-semibold text-[var(--navy)]">
                  Resolution{' '}
                  <span className="font-normal text-[var(--gold-link)]">
                    (within 14 working days)
                  </span>
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  We will provide a full response explaining our findings and any action we will
                  take.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[var(--radius-lg)] border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm text-[var(--muted)]">
              <span className="font-semibold text-[var(--navy)]">Urgent complaints:</span> If
              your complaint concerns data protection or inaccurate information that could cause
              harm, please mark it as &ldquo;URGENT&rdquo; and we will prioritize it.
            </p>
          </div>
        </section>

        {/* Specific Complaint Types */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Specific Complaint Types</h2>

          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">
                Inaccurate Representative Information
              </h3>
              <p className="mb-3 text-sm text-[var(--muted)]">
                If a representative&apos;s profile contains inaccurate information (e.g., wrong
                phone number, closed firm, false accreditation claims), we will:
              </p>
              <ul className="space-y-1.5 text-sm text-[var(--muted)]">
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2713;</span>Contact the representative to
                  verify details
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2713;</span>Temporarily suspend the profile
                  if we cannot reach them
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2713;</span>Remove the profile if
                  information cannot be verified
                </li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">
                Data Protection Complaints
              </h3>
              <p className="text-sm text-[var(--muted)]">
                If your complaint relates to how we handle personal data, you also have the right to
                lodge a complaint with the Information Commissioner&apos;s Office (ICO):{' '}
                <a
                  href="https://ico.org.uk/make-a-complaint/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--gold-link)] hover:underline"
                >
                  ico.org.uk/make-a-complaint
                </a>
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">
                Professional Conduct Complaints
              </h3>
              <p className="mb-3 text-sm text-[var(--muted)]">
                If you have concerns about a representative&apos;s professional conduct or service
                quality, this should be directed to:
              </p>
              <ul className="mb-3 space-y-1.5 text-sm text-[var(--muted)]">
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>Their supervising solicitor firm
                  (if instructed through a firm)
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>The Solicitors Regulation
                  Authority (SRA) if they are a solicitor
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>The firm who instructed them
                  (not the directory)
                </li>
              </ul>
              <p className="text-sm text-[var(--muted)]">
                PoliceStationRepUK does not regulate representatives and is not responsible for
                their conduct.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
          <h2 className="text-h2 mb-2 text-[var(--navy)]">Make a Complaint</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Contact Defence Legal Services Ltd to submit your complaint.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/Contact"
              className="rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-white no-underline hover:bg-[var(--accent-hover)]"
            >
              Contact Us
            </Link>
            <a
              href="mailto:robertcashman@defencelegalservices.co.uk"
              className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-7 py-3 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold-hover)] hover:text-[var(--gold-hover)]"
            >
              Email Complaint
            </a>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
