import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Cookies Policy — PoliceStationRepUK Cookie Preferences',
  description:
    'How PoliceStationRepUK uses cookies and similar technologies. Learn about essential, analytics, and third-party cookies and how to manage your preferences.',
  path: '/Cookies',
});

const COOKIES_TABLE = [
  {
    name: 'session',
    provider: 'Base44 (Auth)',
    purpose: 'Authenticate users and maintain login sessions',
    expiry: 'Session (browser close)',
    type: 'Essential',
  },
  {
    name: 'cookieConsent',
    provider: 'PoliceStationRepUK',
    purpose: 'Store your cookie preference choices',
    expiry: '12 months',
    type: 'Essential',
  },
  {
    name: '__cf_bm / cf_clearance',
    provider: 'Cloudflare',
    purpose: 'Bot management, DDoS protection, and security filtering',
    expiry: 'Up to 30 minutes / 30 days',
    type: 'Essential',
  },
  {
    name: '_ga / _gid / _gat',
    provider: 'Google Analytics',
    purpose: 'Anonymized website usage analytics and visitor statistics',
    expiry: 'Up to 24 months / 24 hours / 1 minute',
    type: 'Analytics (consent required)',
  },
  {
    name: '_gcl_au',
    provider: 'Google Tag Manager',
    purpose: 'Used by Google Analytics for conversion tracking',
    expiry: '90 days',
    type: 'Analytics (consent required)',
  },
];

export default function CookiesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Cookies Policy' },
            ]}
          />
          <header className="mb-10">
            <h1 className="text-h1 text-white">Cookies Policy</h1>
            <p className="mt-2 text-sm text-slate-300">Last updated: 08/03/2026</p>
          </header>
        </div>
      </section>

      <div className="page-container">
      <div className="max-w-3xl space-y-10">
        {/* 1. What Are Cookies */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">1. What Are Cookies</h2>
          <p className="mb-2 text-sm leading-relaxed text-[var(--muted)]">
            Cookies are small text files stored on your device when you visit a website. They help
            websites remember your preferences, enable functionality, and understand how you use the
            site.
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Cookies can be &ldquo;session&rdquo; cookies (deleted when you close your browser) or
            &ldquo;persistent&rdquo; cookies (stored for a set period).
          </p>
        </section>

        {/* 2. How We Use Cookies */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">2. How We Use Cookies</h2>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            2.1 Essential Cookies (Always Active)
          </h3>
          <p className="mb-3 text-sm text-[var(--muted)]">
            These cookies are strictly necessary for the website to function and cannot be disabled:
          </p>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--navy)]">Authentication:</span> Keep
              you logged in and secure your account
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--navy)]">Security:</span> Protect
              against fraud, bots, and malicious activity
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--navy)]">Functionality:</span>{' '}
              Remember your preferences (e.g., cookie consent choices)
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[var(--navy)]">Load Balancing:</span> Ensure
              optimal performance and reliability
            </li>
          </ul>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            2.2 Analytics Cookies (Optional &mdash; Require Consent)
          </h3>
          <p className="mb-3 text-sm text-[var(--muted)]">
            With your consent, we use analytics cookies to:
          </p>
          <ul className="mb-3 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Understand how visitors use the
              website
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Identify popular pages and features
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Measure effectiveness of content and
              layout
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Improve user experience based on
              usage patterns
            </li>
          </ul>
          <p className="mb-6 text-sm text-[var(--muted)]">
            Analytics cookies are disabled by default. You can opt in or out at any time.
          </p>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            2.3 We Do NOT Use
          </h3>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Advertising or tracking cookies
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Social media tracking pixels (unless
              explicitly embedded content)
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Third-party marketing cookies
            </li>
          </ul>
        </section>

        {/* 3. Specific Cookies We Set */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">3. Specific Cookies We Set</h2>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--card-bg)]">
                  <th className="px-4 py-3 font-semibold text-[var(--navy)]">Cookie Name</th>
                  <th className="px-4 py-3 font-semibold text-[var(--navy)]">Provider</th>
                  <th className="px-4 py-3 font-semibold text-[var(--navy)]">Purpose</th>
                  <th className="px-4 py-3 font-semibold text-[var(--navy)]">Expiry</th>
                  <th className="px-4 py-3 font-semibold text-[var(--navy)]">Type</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES_TABLE.map((cookie) => (
                  <tr
                    key={cookie.name}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--navy)]">
                      {cookie.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{cookie.provider}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{cookie.purpose}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{cookie.expiry}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          cookie.type === 'Essential'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {cookie.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Managing Your Cookie Preferences */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            4. Managing Your Cookie Preferences
          </h2>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            4.1 Via Our Cookie Banner
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
            When you first visit the website, a cookie consent banner appears. You can accept all
            cookies, accept only essential cookies, or customise which types of cookies you allow.
          </p>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            4.2 Via Your Browser
          </h3>
          <p className="mb-3 text-sm text-[var(--muted)]">
            You can also manage cookies through your browser settings:
          </p>
          <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>
              <strong>Chrome:</strong> Settings &rarr; Privacy and security &rarr; Cookies and other
              site data
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>
              <strong>Firefox:</strong> Options &rarr; Privacy &amp; Security &rarr; Cookies and
              Site Data
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>
              <strong>Safari:</strong> Preferences &rarr; Privacy &rarr; Manage Website Data
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>
              <strong>Edge:</strong> Settings &rarr; Cookies and site permissions &rarr; Cookies and
              site data
            </li>
          </ul>
          <p className="text-sm text-[var(--muted)]">
            <strong>Note:</strong> Blocking essential cookies may prevent core website functionality.
          </p>
        </section>

        {/* 5. Third-Party Cookies */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">5. Third-Party Cookies</h2>

          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                5.1 Google Analytics (Optional)
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Only set if you consent to analytics cookies</li>
                <li>IP anonymization enabled</li>
                <li>No personally identifiable information collected</li>
                <li>Data shared with Google subject to their privacy policy</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                5.2 Cloudflare (Essential)
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Security and performance cookies required for site operation</li>
                <li>Protects against DDoS attacks and malicious bots</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                5.3 Stripe (Payment Processing)
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Used only on payment pages for featured profile subscriptions</li>
                <li>Helps prevent fraud and ensure secure transactions</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Local Storage */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            6. Local Storage and Similar Technologies
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--muted)]">
            In addition to cookies, we may use HTML5 local storage for:
          </p>
          <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Saving form drafts (to prevent data
              loss during registration)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Storing user preferences locally
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Caching non-sensitive data for
              performance
            </li>
          </ul>
          <p className="text-sm text-[var(--muted)]">
            Local storage data is stored on your device and not transmitted to our servers unless you
            actively submit a form.
          </p>
        </section>

        {/* 7. DNT */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">7. Do Not Track (DNT)</h2>
          <p className="mb-2 text-sm leading-relaxed text-[var(--muted)]">
            We respect &ldquo;Do Not Track&rdquo; browser signals where technically feasible.
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            If DNT is enabled, analytics cookies will not be set even if you previously consented.
          </p>
        </section>

        {/* 8. Updates */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">8. Updates to This Policy</h2>
          <p className="mb-2 text-sm leading-relaxed text-[var(--muted)]">
            We may update this Cookies Policy to reflect changes in technology or legislation.
            Material changes will be communicated via website notice and updated &ldquo;Last
            updated&rdquo; date.
          </p>
          <p className="text-sm text-[var(--muted)]">
            Continued use after changes constitutes acceptance.
          </p>
        </section>

        {/* 9. Contact Us */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">9. Contact Us</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            For questions about cookies or data privacy, email{' '}
            <a
              href="mailto:robertcashman@defencelegalservices.co.uk?subject=Cookies%20Enquiry"
              className="text-[var(--gold-hover)] hover:underline"
            >
              robertcashman@defencelegalservices.co.uk
            </a>{' '}
            with the subject &ldquo;Cookies Enquiry&rdquo;.
          </p>
          <p className="mb-4 text-sm text-[var(--muted)]">
            For more information about how we handle your data, see our{' '}
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

        {/* Contact CTA */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm text-[var(--muted)]">
            Have a question about our use of cookies?{' '}
            <Link href="/Contact" className="font-medium text-[var(--gold-hover)] hover:underline">
              Get in touch
            </Link>{' '}
            and we&apos;ll be happy to help.
          </p>
        </section>
      </div>
    </div>
    </>
  );
}
