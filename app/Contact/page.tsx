import { buildMetadata } from '@/lib/seo';
import { SUPPORT_EMAIL, SUPPORT_MAILTO_HREF } from '@/lib/site-contact';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from './ContactForm';

export const metadata = buildMetadata({
  title: 'Contact the Directory Team — PoliceStationRepUK',
  description:
    'Contact PoliceStationRepUK about the rep directory, listing, or registration. We are not the police — call 999 for emergencies or 101 for non-emergencies.',
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
          <h1 className="mt-3 text-h1 text-white">Contact the Directory Team</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/90">
            This is the contact page for <strong className="text-white">PoliceStationRepUK</strong> — an
            online directory that helps solicitors find police station representatives. We are{' '}
            <strong className="text-white">not the police</strong>.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-2xl">
          {/* NOT THE POLICE — unmissable red warning */}
          <div className="rounded-[var(--radius-lg)] border-2 border-red-600 bg-red-600 p-6 text-white shadow-lg">
            <p className="text-xl font-extrabold uppercase tracking-wide sm:text-2xl">
              We are not the police
            </p>
            <p className="mt-3 text-sm font-semibold leading-relaxed sm:text-base">
              You are not contacting the police. If you submit queries or reports here you will{' '}
              <span className="underline decoration-2">not</span> get a reply from the police with
              regard to any police matters. This is a private directory website for solicitors and
              accredited representatives&nbsp;&mdash; not a police service.
            </p>
            <div className="mt-5 rounded-lg bg-white/10 p-4">
              <p className="text-sm font-bold">If you need the police:</p>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed">
                <li>
                  <strong>Emergency&nbsp;(life at risk / crime in progress):</strong>{' '}
                  Call <a href="tel:999" className="font-bold text-white underline">999</a>
                </li>
                <li>
                  <strong>Non-emergency:</strong>{' '}
                  Call <a href="tel:101" className="font-bold text-white underline">101</a>
                </li>
                <li>
                  <strong>Crimestoppers&nbsp;(anonymous):</strong>{' '}
                  Call <a href="tel:08005551111" className="font-bold text-white underline">0800 555 111</a>
                </li>
              </ul>
            </div>
          </div>

          {/* What this form IS for */}
          <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)]">
            <h2 className="text-base font-bold text-[var(--navy)]">What can we help with?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Use this page only if you are a <strong>solicitor</strong>, a{' '}
              <strong>police station representative</strong>, or have a question about the{' '}
              <strong>PoliceStationRepUK directory</strong>. For example:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
              <li>Registering or updating your rep profile</li>
              <li>Questions about the directory or listing</li>
              <li>Technical issues with the website</li>
              <li>Advertising or partnership enquiries</li>
            </ul>
          </div>

          {/* Direct contact cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <a
              href={SUPPORT_MAILTO_HREF}
              className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
            >
              <span className="mt-0.5 text-xl" aria-hidden="true">📧</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Directory support email
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--gold-link)] break-all">
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
                  SMS (directory queries only)
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--navy)]">07535 494446</p>
              </div>
            </a>
          </div>

          {/* Contact form */}
          <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
            <h2 className="mb-1 text-lg font-bold text-[var(--navy)]">
              Send us a message about the directory
            </h2>
            <p className="mb-6 text-xs text-[var(--muted)]">
              This form goes to the directory admin team — not the police. If you need the police, call 999 or 101.
            </p>
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
