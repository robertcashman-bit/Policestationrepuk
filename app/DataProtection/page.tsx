import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Data Protection Policy — PoliceStationRepUK Privacy',
  description:
    'Technical and organizational measures Defence Legal Services Ltd implements to protect personal data processed through PoliceStationRepUK.',
  path: '/DataProtection',
});

const RETENTION_TABLE = [
  { category: 'Active user profiles', period: 'Duration of account + 30 days post-deletion' },
  { category: 'Inactive profiles (2+ years)', period: 'Archived, then deleted after notification' },
  { category: 'Billing records', period: '7 years (tax/accounting requirement)' },
  { category: 'Support communications', period: '3 years' },
  { category: 'Security logs', period: '1 year' },
  { category: 'Backups', period: '90 days rolling retention' },
];

export default function DataProtectionPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Data Protection Policy' },
            ]}
          />
          <header className="mb-10">
            <h1 className="text-h1 text-white">Data Protection Policy</h1>
            <p className="mt-2 text-sm text-white">Last updated: 08/03/2026</p>
          </header>
        </div>
      </section>

      <div className="page-container">
      <div className="max-w-3xl space-y-10">
        {/* 1. Policy Overview */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">1. Policy Overview</h2>
          <p className="mb-2 text-sm leading-relaxed text-[var(--muted)]">
            This Data Protection Policy outlines the technical and organizational measures Defence
            Legal Services Ltd implements to protect personal data processed through
            PoliceStationRepUK.
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            This policy supplements our{' '}
            <Link href="/Privacy" className="text-[var(--gold-hover)] hover:underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/GDPR" className="text-[var(--gold-hover)] hover:underline">
              GDPR Policy
            </Link>
            .
          </p>
        </section>

        {/* 2. Data Governance Framework */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">2. Data Governance Framework</h2>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            2.1 Accountability
          </h3>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Senior management responsible for
              data protection compliance
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Regular compliance audits and reviews
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Documented policies and procedures
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Staff training on data protection
              obligations
            </li>
          </ul>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            2.2 Documentation
          </h3>
          <p className="mb-3 text-sm text-[var(--muted)]">
            We maintain comprehensive records including:
          </p>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Records of Processing Activities
              (ROPA)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Data Protection Impact Assessments
              (DPIAs)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Data breach incident logs
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Data sharing agreements with
              processors
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Consent records and opt-out requests
            </li>
          </ul>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            2.3 Access Controls
          </h3>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Role-based access permissions
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Admin access restricted to
              authorized personnel only
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Multi-factor authentication for
              sensitive operations
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Regular access rights reviews
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Audit trail of all admin actions
            </li>
          </ul>
        </section>

        {/* 3. Technical Security Controls */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">3. Technical Security Controls</h2>
          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                3.1 Encryption
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li><strong>In Transit:</strong> TLS 1.2+ encryption for all data transmitted over the internet</li>
                <li><strong>At Rest:</strong> Database encryption for stored personal data</li>
                <li><strong>Backups:</strong> Encrypted backup files stored securely</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                3.2 Infrastructure Security
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Hosting on ISO 27001 certified platforms</li>
                <li>Regular security patches and updates</li>
                <li>Firewall and DDoS protection</li>
                <li>Intrusion detection and prevention systems</li>
                <li>Secure development practices</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                3.3 Authentication and Access
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Strong password requirements</li>
                <li>Session timeout and automatic logout</li>
                <li>Protection against brute-force attacks</li>
                <li>Secure password reset mechanisms</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                3.4 Monitoring and Logging
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Real-time security monitoring</li>
                <li>Audit logs for data access and modifications</li>
                <li>Anomaly detection for unusual activity</li>
                <li>Log retention for forensic analysis</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Organizational Security Measures */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            4. Organizational Security Measures
          </h2>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            4.1 Staff Training and Awareness
          </h3>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Mandatory data protection training
              for all staff
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Regular refresher courses and
              updates
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Confidentiality agreements for staff
              and contractors
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Clear escalation procedures for
              security concerns
            </li>
          </ul>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            4.2 Policies and Procedures
          </h3>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Acceptable Use Policy for staff
              systems
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Clear desk and screen policy
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Secure disposal procedures for
              physical records
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Remote working security guidelines
            </li>
          </ul>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            4.3 Vendor Management
          </h3>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Due diligence on all third-party
              processors
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Data Processing Agreements (DPAs)
              in place
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Regular processor compliance reviews
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Clear contractual security
              requirements
            </li>
          </ul>
        </section>

        {/* 5. Data Breach Management */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">5. Data Breach Management</h2>
          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                5.1 Detection and Assessment
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>24/7 monitoring for security incidents</li>
                <li>Immediate assessment of breach severity and scope</li>
                <li>Classification: containment, eradication, recovery</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                5.2 Notification Procedures
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>ICO notification within 72 hours (where required by law)</li>
                <li>Affected individuals notified without undue delay</li>
                <li>Clear communication of risks and mitigation steps</li>
                <li>Documented breach response for compliance</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                5.3 Post-Incident Review
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Root cause analysis</li>
                <li>Lessons learned documentation</li>
                <li>Implementation of preventative measures</li>
                <li>Policy and procedure updates where necessary</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Data Retention Standards */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">6. Data Retention Standards</h2>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            6.1 Retention Periods
          </h3>
          <div className="mb-6 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--card-bg)]">
                  <th className="px-4 py-3 font-semibold text-[var(--navy)]">
                    Data Category
                  </th>
                  <th className="px-4 py-3 font-semibold text-[var(--navy)]">
                    Retention Period
                  </th>
                </tr>
              </thead>
              <tbody>
                {RETENTION_TABLE.map((row) => (
                  <tr
                    key={row.category}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--navy)]">
                      {row.category}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{row.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            6.2 Deletion Procedures
          </h3>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Secure deletion from production
              databases
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Removal from backups within
              retention period
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Anonymization where deletion not
              possible
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Certification of deletion upon
              request
            </li>
          </ul>
        </section>

        {/* 7. Third-Party Data Processors */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">7. Third-Party Data Processors</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            We use the following categories of processors:
          </p>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                Database &amp; Hosting
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--navy)]">Supabase</p>
              <p className="text-xs text-[var(--muted)]">EEA-based, ISO 27001 certified</p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                Payment Processing
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--navy)]">Stripe</p>
              <p className="text-xs text-[var(--muted)]">PCI DSS compliant</p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">Email Services</p>
              <p className="mt-1 text-sm font-medium text-[var(--navy)]">
                Transactional email provider
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">Analytics</p>
              <p className="mt-1 text-sm font-medium text-[var(--navy)]">Google Analytics</p>
              <p className="text-xs text-[var(--muted)]">Anonymized IP, GDPR compliant settings</p>
            </div>
          </div>
          <p className="text-sm text-[var(--muted)]">
            All processors operate under Data Processing Agreements, provide appropriate security
            guarantees, are prohibited from using data for their own purposes, and comply with UK
            GDPR requirements.
          </p>
        </section>

        {/* 8. International Data Transfers */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            8. International Data Transfers
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--muted)]">
            Where data is transferred outside the UK/EEA, we ensure:
          </p>
          <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Adequacy decisions exist, or
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Standard Contractual Clauses (SCCs)
              are in place, or
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Other appropriate safeguards as
              recognized by UK law
            </li>
          </ul>
          <p className="text-sm text-[var(--muted)]">
            We conduct Transfer Impact Assessments (TIAs) for high-risk transfers.
          </p>
        </section>

        {/* 9. Contact and Complaints */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">9. Contact and Complaints</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            For data protection enquiries or concerns:
          </p>
          <div className="mb-4 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
            <p className="text-sm text-[var(--muted)]">
              <span className="font-semibold text-[var(--navy)]">Email:</span>{' '}
              <a
                href="mailto:robertcashman@defencelegalservices.co.uk?subject=Data%20Protection%20Enquiry"
                className="text-[var(--gold-hover)] hover:underline"
              >
                robertcashman@defencelegalservices.co.uk
              </a>
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Subject: &ldquo;Data Protection Enquiry&rdquo;
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">
            You also have the right to complain to the Information Commissioner&apos;s Office (ICO)
            at{' '}
            <a
              href="https://ico.org.uk/make-a-complaint/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--gold-hover)] hover:underline"
            >
              ico.org.uk/make-a-complaint
            </a>
            .
          </p>
        </section>

        {/* Contact CTA */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm text-[var(--muted)]">
            Have a data protection concern?{' '}
            <Link href="/Contact" className="font-medium text-[var(--gold-hover)] hover:underline">
              Contact us
            </Link>{' '}
            and we&apos;ll respond promptly.
          </p>
        </section>
      </div>
    </div>
    </>
  );
}
