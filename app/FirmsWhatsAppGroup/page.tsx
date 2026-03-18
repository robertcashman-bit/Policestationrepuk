import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'WhatsApp Job Group for Criminal Defence Firms | PoliceStationRepUK',
  description: 'For criminal defence firms and solicitors to post urgent and planned police station cover jobs directly to accredited representatives across England & Wale',
  path: '/FirmsWhatsAppGroup',
});

export default function FirmsWhatsAppGroupPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'WhatsApp Job Group for Criminal Defen...' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">WhatsApp Job Group for Criminal Defence Firms</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">For criminal defence firms and solicitors to post urgent and planned police station cover jobs directly to accredited representatives across England &amp; Wales — free, verified, and monitored by a practising solicitor</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">What This Is</h2>
            <p className="text-[var(--muted)] leading-relaxed">A private WhatsApp group for criminal defence firms to post police station cover jobsAccess limited to verified criminal defence firms onlyMonitored by a practising solicitor to ensure professional standardsConnects firms directly with accredited representatives for urgent and planned cover.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Why Access Is Controlled</h2>
            <p className="text-[var(--muted)] leading-relaxed">Access to this group is restricted to genuine criminal defence firms to:•Ensure posted jobs are genuine and legitimate•Protect both firms and accredited representatives•Prevent spam, misuse, and inappropriate content•Maintain professional standards and trust within the network.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">How to Request Access</h2>
            <p className="text-[var(--muted)] leading-relaxed">To request access, please text the following details to:07535 494446Required Information (all mandatory):Full name (of the person requesting access)Firm nameFirm email addressText 07535 494446 to Request AccessVerification ProcessThese details allow us to verify that the request is from a genuine criminal defence firm before granting access to the group.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">What Happens Next</h2>
            <p className="text-[var(--muted)] leading-relaxed">1Your details are checkedWe verify that the request is from a genuine criminal defence firm2You may be contacted if clarification is neededWe may follow up to confirm firm details or ask additional questionsOnce verified, you are added to the WhatsApp groupYou&apos;ll receive a WhatsApp invitation to join the groupIf you are unable to text, please email the same details to robertcashman@defencelegalservices.co.ukOperated by Robert Cashman, Duty Solicitor &amp; Higher Rights AdvocateThe WhatsApp group facilitates introductions only.</p>
            <p className="text-[var(--muted)] leading-relaxed">Instruction, supervision, and payment remain the responsibility of the instructing firm.</p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-2 text-slate-300">
              Find an accredited police station representative or get in touch with our team.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a Rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
