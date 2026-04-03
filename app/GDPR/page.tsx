import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'GDPR Policy — UK GDPR Compliance | PoliceStationRepUK',
  description:
    'How PoliceStationRepUK complies with UK GDPR. Learn about the seven data protection principles, lawful bases for processing, and your data subject rights.',
  path: '/GDPR',
});

export default function GDPRPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'GDPR Policy' },
            ]}
          />
          <header className="mb-10">
            <h1 className="text-h1 text-white">GDPR Policy</h1>
            <p className="mt-2 text-sm text-slate-300">Last updated: 08/03/2026</p>
          </header>
        </div>
      </section>

      <div className="page-container">
      <div className="max-w-3xl space-y-10">
        {/* 1. GDPR Compliance Statement */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">1. GDPR Compliance Statement</h2>
          <p className="mb-2 text-sm leading-relaxed text-[var(--muted)]">
            Defence Legal Services Ltd is committed to full compliance with the UK General Data
            Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            This policy outlines how we uphold the seven key principles of data protection in our
            operations.
          </p>
        </section>

        {/* 2. The Seven GDPR Principles */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">2. The Seven GDPR Principles</h2>
          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.1 Lawfulness, Fairness and Transparency
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>We process data lawfully under defined legal bases (contract, legitimate interests, consent, legal obligations)</li>
                <li>We are transparent about what data we collect and why (see <Link href="/Privacy" className="text-[var(--gold-link)] hover:underline">Privacy Policy</Link>)</li>
                <li>We treat all data subjects fairly without discrimination</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.2 Purpose Limitation
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Data collected for specific, explicit, and legitimate purposes</li>
                <li>We do not use data for unrelated purposes without your consent</li>
                <li>Purpose clearly stated at point of collection</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.3 Data Minimisation
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>We collect only data that is adequate, relevant, and necessary</li>
                <li>We avoid collecting excessive or unnecessary information</li>
                <li>Regular review of data fields to ensure continued necessity</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.4 Accuracy
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>We take reasonable steps to ensure data accuracy</li>
                <li>You can update your profile information at any time</li>
                <li>We correct inaccuracies promptly upon notification</li>
                <li>Periodic verification of representative credentials</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.5 Storage Limitation
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Data retained only as long as necessary for stated purposes</li>
                <li>Clear retention periods defined for different data categories</li>
                <li>Automated and manual deletion procedures in place</li>
                <li>Regular audits of retained data</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.6 Integrity and Confidentiality (Security)
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Technical measures: encryption, access controls, secure hosting</li>
                <li>Organizational measures: staff training, policies, audit trails</li>
                <li>Regular security assessments and penetration testing</li>
                <li>Incident response and breach notification procedures</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.7 Accountability
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>We maintain comprehensive records of processing activities</li>
                <li>Data Protection Impact Assessments (DPIAs) for high-risk processing</li>
                <li>Regular compliance reviews and audits</li>
                <li>Clear documentation of policies and procedures</li>
                <li>Staff training and awareness programs</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Lawful Bases for Processing */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">3. Lawful Bases for Processing</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            We rely on the following lawful bases:
          </p>

          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                3.1 Contract (Article 6(1)(b))
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Creating and managing your account</li>
                <li>Providing directory listing services</li>
                <li>Processing featured profile subscriptions</li>
                <li>Delivering services you&apos;ve requested</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                3.2 Legitimate Interests (Article 6(1)(f))
              </h3>
              <ul className="mb-3 space-y-1 text-sm text-[var(--muted)]">
                <li>Operating a safe and effective professional directory</li>
                <li>Preventing fraud and ensuring platform security</li>
                <li>Analyzing usage to improve services</li>
                <li>Direct marketing to existing customers (with opt-out option)</li>
              </ul>
              <p className="text-sm text-[var(--muted)]">
                We conduct Legitimate Interest Assessments (LIAs) to ensure our interests do not
                override your rights and freedoms.
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                3.3 Legal Obligations (Article 6(1)(c))
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Complying with law enforcement requests</li>
                <li>Tax and accounting record retention</li>
                <li>Responding to regulatory enquiries</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                3.4 Consent (Article 6(1)(a))
              </h3>
              <ul className="mb-2 space-y-1 text-sm text-[var(--muted)]">
                <li>Optional marketing communications</li>
                <li>Non-essential analytics cookies</li>
              </ul>
              <p className="text-sm text-[var(--muted)]">
                You may withdraw consent at any time.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Data Subject Rights */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">4. Data Subject Rights</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            See our{' '}
            <Link href="/Privacy" className="text-[var(--gold-link)] hover:underline">
              Privacy Policy
            </Link>{' '}
            for full details on exercising your rights, including:
          </p>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Access, rectification, erasure
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Restriction of processing, data
              portability
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Object to processing, withdraw
              consent
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Not to be subject to automated
              decision-making
            </li>
          </ul>
        </section>

        {/* 5. Data Protection Officer */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">5. Data Protection Officer</h2>
          <p className="mb-2 text-sm leading-relaxed text-[var(--muted)]">
            As a small to medium organization, we are not required to appoint a formal DPO under UK
            GDPR. Data protection enquiries are handled by our management team.
          </p>
          <p className="text-sm text-[var(--muted)]">
            Contact:{' '}
            <a
              href="mailto:robertcashman@defencelegalservices.co.uk?subject=Data%20Protection%20Enquiry"
              className="text-[var(--gold-link)] hover:underline"
            >
              robertcashman@defencelegalservices.co.uk
            </a>{' '}
            (subject: &ldquo;Data Protection Enquiry&rdquo;)
          </p>
        </section>

        {/* 6. Security Measures */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">6. Security Measures</h2>
          <p className="text-sm text-[var(--muted)]">
            See our{' '}
            <Link href="/DataProtection" className="text-[var(--gold-link)] hover:underline">
              Data Protection Policy
            </Link>{' '}
            for comprehensive details on our technical and organizational security controls.
          </p>
        </section>

        {/* 7. Privacy by Design */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            7. Privacy by Design and Default
          </h2>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>We embed data protection into our
              systems and processes from the outset
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Default settings are
              privacy-protective (e.g., sensitive fields marked private, minimal data collection)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>We conduct DPIAs for new features
              that may present privacy risks
            </li>
          </ul>
          <p className="mt-4 text-sm text-[var(--muted)]">
            For detailed information on specific aspects of data protection, please see our{' '}
            <Link href="/Privacy" className="text-[var(--gold-link)] hover:underline">
              Privacy Policy
            </Link>
            ,{' '}
            <Link href="/DataProtection" className="text-[var(--gold-link)] hover:underline">
              Data Protection Policy
            </Link>
            , and{' '}
            <Link href="/Cookies" className="text-[var(--gold-link)] hover:underline">
              Cookies Policy
            </Link>
            .
          </p>
        </section>

        {/* Contact CTA */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm text-[var(--muted)]">
            Have a question about GDPR or data protection?{' '}
            <Link href="/Contact" className="font-medium text-[var(--gold-link)] hover:underline">
              Get in touch
            </Link>{' '}
            and we&apos;ll respond within 7 working days.
          </p>
        </section>
      </div>
    </div>
    </>
  );
}
