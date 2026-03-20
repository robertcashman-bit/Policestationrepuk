import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Accessibility Statement',
  description:
    'Our commitment to web accessibility. Learn about the measures we implement to meet WCAG 2.2 Level AA, supported assistive technologies, and how to report barriers.',
  path: '/Accessibility',
});

export default function AccessibilityPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Accessibility Statement' },
            ]}
          />
          <header className="mb-10">
            <h1 className="text-h1 text-white">Accessibility Statement</h1>
            <p className="mt-2 text-sm text-slate-300">Last updated: 08/03/2026</p>
          </header>
        </div>
      </section>

      <div className="page-container">
      <div className="max-w-3xl space-y-10">
        {/* 1. Our Commitment */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">1. Our Commitment</h2>
          <p className="mb-2 text-sm leading-relaxed text-[var(--muted)]">
            Defence Legal Services Ltd is committed to ensuring PoliceStationRepUK is accessible to
            everyone, including people with disabilities.
          </p>
          <p className="mb-2 text-sm leading-relaxed text-[var(--muted)]">
            We aim to conform to the{' '}
            <strong>Web Content Accessibility Guidelines (WCAG) 2.2 Level AA</strong> standard.
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            We continually work to improve accessibility and welcome feedback to help us serve all
            users effectively.
          </p>
        </section>

        {/* 2. Accessibility Measures Implemented */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            2. Accessibility Measures Implemented
          </h2>
          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.1 Design and Structure
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Semantic HTML5 markup with proper heading hierarchy (h1&ndash;h6)</li>
                <li>Logical page structure and navigation order</li>
                <li>Clear, consistent layout across all pages</li>
                <li>Responsive design that works on all screen sizes</li>
                <li>Skip links to bypass repetitive navigation</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.2 Navigation and Interaction
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Full keyboard navigation support (Tab, Enter, Escape keys)</li>
                <li>Visible focus indicators on interactive elements</li>
                <li>Clear, descriptive link text (no &ldquo;click here&rdquo;)</li>
                <li>Accessible dropdown menus and forms</li>
                <li>Touch-friendly button sizes for mobile users</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.3 Visual Design
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>High color contrast ratios meeting WCAG AA standards (4.5:1 for normal text)</li>
                <li>Text that can be resized up to 200% without loss of functionality</li>
                <li>Clear, readable fonts (minimum 16px base size)</li>
                <li>Color not used as the sole means of conveying information</li>
                <li>Reduced motion options respected (prefers-reduced-motion)</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.4 Content and Readability
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Plain language where possible</li>
                <li>Clear explanations of technical terms</li>
                <li>Descriptive page titles and headings</li>
                <li>Alt text for all meaningful images</li>
                <li>ARIA labels and descriptions for complex components</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-2 text-sm font-semibold text-[var(--navy)]">
                2.5 Screen Reader Support
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Tested with NVDA and JAWS screen readers</li>
                <li>Proper ARIA landmark roles (navigation, main, complementary)</li>
                <li>Form labels properly associated with inputs</li>
                <li>Error messages announced to screen readers</li>
                <li>Loading states and dynamic content announced</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Known Limitations */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">3. Known Limitations</h2>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            3.1 Third-Party Content
          </h3>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-yellow-600">&#x26A0;</span>External links (e.g., GOV.UK forms)
              are managed by third parties and may not meet our accessibility standards
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">&#x26A0;</span>Embedded content (e.g., Google Maps)
              controlled by external providers
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>We provide alternatives where
              possible (e.g., text addresses alongside maps)
            </li>
          </ul>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            3.2 PDF Documents
          </h3>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-yellow-600">&#x26A0;</span>Some linked PDF forms may not be
              fully tagged for screen readers
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>We link to official sources
              (GOV.UK) where accessibility is typically better
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Contact us if you need an
              alternative accessible format
            </li>
          </ul>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            3.3 Legacy Content
          </h3>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-yellow-600">&#x26A0;</span>Older pages may not fully meet
              current standards
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>We are progressively updating all
              content
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Priority given to high-traffic and
              critical pages
            </li>
          </ul>
        </section>

        {/* 4. Assistive Technologies Supported */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            4. Assistive Technologies Supported
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">
                Screen Readers
              </h3>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>NVDA (Windows) &mdash; tested regularly</li>
                <li>JAWS (Windows) &mdash; tested regularly</li>
                <li>VoiceOver (macOS/iOS) &mdash; tested regularly</li>
                <li>TalkBack (Android) &mdash; tested periodically</li>
              </ul>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">
                Browsers and Platforms
              </h3>
              <p className="mb-2 text-sm text-[var(--muted)]">Tested and supported on:</p>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                <li>Chrome, Firefox, Safari, Edge (latest 2 versions)</li>
                <li>Windows, macOS, iOS, Android</li>
                <li>Desktop and mobile devices</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Feedback and Contact */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">5. Feedback and Contact</h2>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            5.1 Report an Accessibility Barrier
          </h3>
          <p className="mb-4 text-sm text-[var(--muted)]">
            If you encounter any accessibility issues or have suggestions for improvement:
          </p>
          <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                Email (Preferred)
              </p>
              <a
                href="mailto:robertcashman@defencelegalservices.co.uk?subject=Accessibility%20Feedback"
                className="text-sm text-[var(--gold-hover)] hover:underline"
              >
                robertcashman@defencelegalservices.co.uk
              </a>
              <p className="text-xs text-[var(--muted)]">
                Subject: &ldquo;Accessibility Feedback&rdquo;
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">Postal Address</p>
              <address className="text-sm not-italic text-[var(--muted)]">
                Accessibility Coordinator<br />
                Defence Legal Services Ltd<br />
                Greenacre, London Road<br />
                West Kingsdown, Sevenoaks<br />
                Kent, TN15 6ER<br />
                United Kingdom
              </address>
            </div>
          </div>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            5.2 What to Include
          </h3>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Description of the accessibility
              barrier
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Page URL where the issue occurs
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Browser and assistive technology
              you&apos;re using
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Screenshot or error message (if
              applicable)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>How the issue affects your use of
              the website
            </li>
          </ul>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            5.3 Our Response
          </h3>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Acknowledgement within 2 working
              days
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Investigation and resolution plan
              within 7 working days
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Fixes implemented as soon as
              reasonably possible
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Follow-up to confirm issue is
              resolved
            </li>
          </ul>
        </section>

        {/* 6. Compliance Status */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">6. Compliance Status</h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--muted)]">
            We believe this website is <strong>partially compliant</strong> with WCAG 2.2 Level AA.
          </p>

          <h3 className="mb-2 text-base font-semibold text-[var(--navy)]">
            Non-Compliances
          </h3>
          <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-yellow-600">&#x26A0;</span>Some third-party embedded content may
              not be fully accessible
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">&#x26A0;</span>Certain PDF documents linked from
              external sources may lack proper tagging
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">&#x26A0;</span>Legacy content may not meet current
              standards (being updated progressively)
            </li>
          </ul>
          <p className="text-sm text-[var(--muted)]">
            At present, we have not identified any accessibility improvements that would constitute a
            disproportionate burden under the Equality Act 2010.
          </p>
        </section>

        {/* 7. Enforcement Procedure */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">7. Enforcement Procedure</h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--muted)]">
            If you are not satisfied with our response to an accessibility complaint, you may
            contact:
          </p>
          <div className="mb-4 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
            <p className="text-sm font-semibold text-[var(--navy)]">
              Equality and Human Rights Commission (EHRC)
            </p>
            <p className="text-sm text-[var(--muted)]">
              Website:{' '}
              <a
                href="https://www.equalityhumanrights.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--gold-hover)] hover:underline"
              >
                equalityhumanrights.com
              </a>
            </p>
            <p className="text-sm text-[var(--muted)]">Phone: 0808 800 0082</p>
            <p className="text-sm text-[var(--muted)]">Textphone: 0808 800 0084</p>
          </div>
          <p className="text-sm text-[var(--muted)]">
            For Northern Ireland residents, contact the Equality Commission for Northern Ireland.
          </p>
        </section>

        {/* 8. Technical Specifications */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">8. Technical Specifications</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            This website relies on the following technologies:
          </p>
          <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>HTML5
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>CSS3 (with Tailwind CSS framework)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>JavaScript (React framework)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>ARIA attributes for accessibility
            </li>
          </ul>
          <p className="text-sm text-[var(--muted)]">
            The website should work with JavaScript disabled, though some interactive features may
            be limited.
          </p>
          <p className="mt-4 text-sm text-[var(--muted)]">
            We are dedicated to making our website accessible to the widest possible audience. This
            statement will be reviewed and updated regularly as we continue to improve
            accessibility.
          </p>
        </section>

        {/* Contact CTA */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm text-[var(--muted)]">
            Encountered an accessibility barrier?{' '}
            <Link href="/Contact" className="font-medium text-[var(--gold-hover)] hover:underline">
              Let us know
            </Link>{' '}
            and we&apos;ll work to resolve it promptly.
          </p>
        </section>
      </div>
    </div>
    </>
  );
}
