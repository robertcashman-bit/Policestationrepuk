import { buildMetadata } from '@/lib/seo';
import { SUPPORT_EMAIL, SUPPORT_MAILTO_HREF } from '@/lib/site-contact';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from './ContactForm';

export const metadata = buildMetadata({
  title: 'Contact PoliceStationRepUK — Directory Support & Enquiries',
  description:
    'Contact the PoliceStationRepUK team about the rep directory, registration, or general enquiries for criminal defence and police station representation.',
  path: '/Contact',
});

export default function ContactPage() {
  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Contact' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Get in Touch</h1>
          <p className="mt-3 max-w-2xl text-lg text-white">
            Have questions or feedback? We&apos;d love to hear from you. We usually respond to email within 24 hours and SMS sooner.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-2xl">
          {/* Direct contact cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={SUPPORT_MAILTO_HREF}
              className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
            >
              <span className="mt-0.5 text-xl" aria-hidden="true">📧</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Support email (preferred)
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--gold-hover)] break-all">
                  {SUPPORT_EMAIL}
                </p>
              </div>
            </a>
            <a
              href="sms:07535494446"
              className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
            >
              <span className="mt-0.5 text-xl" aria-hidden="true">💬</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  SMS (Urgent matters only)
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--navy)]">07535 494446</p>
              </div>
            </a>
          </div>

          {/* Contact form */}
          <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
            <h2 className="mb-6 text-lg font-bold text-[var(--navy)]">
              Send us a message
            </h2>
            <ContactForm />
          </section>

          {/* Regulatory notice */}
          <div className="mt-6 rounded-[var(--radius)] border border-yellow-200 bg-yellow-50 p-4 text-xs leading-relaxed text-yellow-900">
            <strong>Important Notice:</strong> PoliceStationRepUK is operated by{' '}
            <strong>Defence Legal Services Ltd</strong> — an independent directory service. We are{' '}
            <strong>not</strong> affiliated with The Law Society, SRA, LCCSA, CLSA, the Legal
            Ombudsman, any UK police force, or any government body. We cannot provide legal advice,
            access case management systems, or influence active cases.
          </div>
        </div>
      </div>
    </>
  );
}
