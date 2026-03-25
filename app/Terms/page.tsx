import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Terms & Conditions — PoliceStationRepUK Directory Usage',
  description:
    'Terms and conditions for using the PoliceStationRepUK directory. Covers directory status, user responsibilities, limitation of liability, and featured listings.',
  path: '/Terms',
});

export default function TermsPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Terms & Conditions' },
            ]}
          />
          <header className="mb-10">
            <h1 className="text-h1 text-white">Terms &amp; Conditions</h1>
            <p className="mt-2 text-sm text-slate-300">Last updated: 4 January 2026</p>
          </header>
        </div>
      </section>

      <div className="page-container">
      <div className="max-w-3xl space-y-10">
        {/* Directory Status */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            Directory Status and No Intermediation
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
            PoliceStationRepUK.com does not act as an agent, introducer, or intermediary for legal
            services. Listings are provided for information only. Any engagement between a police
            station representative and a law firm or organisation is a matter solely between those
            parties.
          </p>
          <p className="mb-3 text-sm font-semibold text-[var(--navy)]">This website:</p>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Does not provide legal advice
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Does not offer regulated legal services
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Is not authorised or regulated by the
              Solicitors Regulation Authority
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Does not arrange, mediate, or facilitate
              the provision of legal services
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Does not guarantee the availability,
              quality, or conduct of listed representatives
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            All legal services are provided by the independent professionals and organisations listed
            on this site, each of whom is responsible for their own regulatory compliance,
            professional indemnity insurance, and standards of service.
          </p>
        </section>

        {/* Website Operator */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Website Operator</h2>
          <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <span className="font-semibold text-[var(--navy)]">Operated by:</span>{' '}
                Defence Legal Services Ltd
              </li>
              <li>
                <span className="font-semibold text-[var(--navy)]">Contact:</span>{' '}
                <a
                  href="mailto:robertcashman@defencelegalservices.co.uk"
                  className="text-[var(--gold-hover)] hover:underline"
                >
                  robertcashman@defencelegalservices.co.uk
                </a>
              </li>
              <li>
                <span className="font-semibold text-[var(--navy)]">Phone:</span>{' '}
                <a href="tel:07535494446" className="text-[var(--gold-hover)] hover:underline">
                  07535 494446
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* Service Description */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Service Description</h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--muted)]">
            PoliceStationRepUK is a free directory platform connecting criminal defence solicitors
            with police station representatives. We provide:
          </p>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>A searchable database of registered
              representatives
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Police station contact information
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Legal resources and guides
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Optional featured/premium placement
              for representatives (paid service)
            </li>
          </ul>
        </section>

        {/* Verification */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            Verification &amp; Accuracy Notice
          </h2>
          <div className="rounded-[var(--radius-lg)] border border-yellow-200 bg-yellow-50 p-6">
            <p className="mb-3 text-sm font-semibold text-[var(--navy)]">
              Important &mdash; Please Read:
            </p>
            <p className="mb-3 text-sm leading-relaxed text-[var(--muted)]">
              We confirm information provided by representatives at the point of registration, such
              as contact details and stated accreditation. We do not independently audit:
            </p>
            <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
              <li className="flex gap-2">
                <span className="text-yellow-600">&#x26A0;</span>Ongoing availability or workload
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-600">&#x26A0;</span>Professional indemnity insurance
                status
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-600">&#x26A0;</span>Performance, conduct, or quality of
                service
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-600">&#x26A0;</span>Ongoing accreditation status with
                regulatory bodies
              </li>
            </ul>
            <p className="text-sm font-semibold text-[var(--navy)]">
              Listings are not endorsements.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Solicitor firms must conduct their own due diligence before instructing any
              representative, including verification of current accreditation status, insurance, and
              suitability for the specific case.
            </p>
          </div>
        </section>

        {/* User Responsibilities */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">User Responsibilities</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">
                For Representatives
              </h3>
              <ul className="space-y-1.5 text-sm text-[var(--muted)]">
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>You must be fully accredited
                  (PSRAS or duty solicitor qualified)
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>All information you provide must
                  be accurate and current
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>You must update your profile if
                  your details change
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>You are responsible for
                  maintaining valid insurance and accreditation
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>Misrepresentation of
                  qualifications is a criminal offence
                </li>
              </ul>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">
                For Solicitor Firms
              </h3>
              <ul className="space-y-1.5 text-sm text-[var(--muted)]">
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>You must verify accreditation and
                  insurance before instructing any representative
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>You are responsible for client
                  care and conduct of cases
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2022;</span>The directory is a finding tool
                  only &mdash; we do not recommend specific reps
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Limitation of Liability</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            PoliceStationRepUK (Defence Legal Services Ltd) is not responsible for:
          </p>
          <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>The conduct, performance, or quality of
              service provided by representatives
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Inaccurate or outdated information
              provided by representatives
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Disputes between solicitors and
              representatives
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Professional negligence by
              representatives
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Losses arising from use of the directory
            </li>
          </ul>
          <p className="text-sm text-[var(--muted)]">
            We provide the directory &ldquo;as is&rdquo; without warranty of any kind.
          </p>
        </section>

        {/* Featured Listings */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Featured Listings</h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--muted)]">
            Featured/premium placements are paid promotional listings. Featured representatives pay
            for priority placement in search results and homepage visibility. Featured status does
            not indicate endorsement, quality rating, or recommendation by PoliceStationRepUK.
          </p>
          <p className="text-sm text-[var(--muted)]">
            All featured listings are clearly labelled as &ldquo;Featured&rdquo; or
            &ldquo;Advertisement&rdquo;.
          </p>
        </section>

        {/* Reporting Inaccuracies */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Reporting Inaccuracies</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            If you find inaccurate information in a representative&apos;s profile:
          </p>
          <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Email{' '}
              <a
                href="mailto:robertcashman@defencelegalservices.co.uk"
                className="text-[var(--gold-hover)] hover:underline"
              >
                robertcashman@defencelegalservices.co.uk
              </a>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Use the &ldquo;Suggest Edit&rdquo;
              feature on station pages
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Call{' '}
              <a href="tel:07535494446" className="text-[var(--gold-hover)] hover:underline">
                07535 494446
              </a>
            </li>
          </ul>
          <p className="text-sm text-[var(--muted)]">
            We will review reported inaccuracies within 7 working days and take appropriate action,
            which may include contacting the representative for clarification or removing the
            listing.
          </p>
        </section>

        {/* Contact CTA */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
          <h2 className="text-h2 mb-2 text-[var(--navy)]">Questions About These Terms?</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Contact Defence Legal Services Ltd for any enquiries about these terms and conditions.
          </p>
          <Link
            href="/Contact"
            className="inline-block rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-white no-underline hover:bg-[var(--accent-hover)]"
          >
            Contact Us
          </Link>
        </section>
      </div>
    </div>
    </>
  );
}
