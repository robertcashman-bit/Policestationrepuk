import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Ico | PoliceStationRepUK',
  description: 'Last updated: 08/03/2026',
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
              { label: 'Ico' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">ICO Statement</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">Last updated: 08/03/2026</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">1. ICO Registration</h2>
            <p className="text-[var(--muted)] leading-relaxed">1.1 Registration DetailsDefence Legal Services Ltd is registered with the Information Commissioner&apos;s Office (ICO) as a data controller.ICO RegistrationRegistration Number: ZA198500Organization: Defence Legal Services LtdRegistered Address: Greenacre, London Road, West Kingsdown, Sevenoaks, Kent, TN15 6ER1.2 Purpose of RegistrationOur ICO registration covers processing of personal data for:Professional directory servicesMarketing and advertisingStaff administrationAccounts and records management.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">2. Verification of Registration</h2>
            <p className="text-[var(--muted)] leading-relaxed">2.1 You can verify our registration on the ICO&apos;s public register:ICO Data Protection RegisterSearch for registration number ZA198500 or organization name Defence Legal Services LtdVisit ICO Register.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">3. Your Data Protection Rights</h2>
            <p className="text-[var(--muted)] leading-relaxed">3.1 Under UK GDPR, you have the right to:Be informed about how your data is usedAccess your personal dataRectify inaccurate or incomplete dataRequest erasure of your dataRestrict processing in certain circumstancesData portabilityObject to processing based on legitimate interestsNot be subject to automated decision-making3.2 For full details on exercising these rights, see our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">4. How to Raise a Data Protection Concern</h2>
            <p className="text-[var(--muted)] leading-relaxed">Step 1: Contact Us FirstWe encourage you to contact us directly with any data protection concerns:Email: robertcashman@defencelegalservices.co.ukSubject: &quot;Data Protection Concern&quot;We aim to respond within 5 working days and resolve issues within 1 month.Step 2: Escalate to the ICO (If Unresolved)If you remain dissatisfied after our response, you can complain to the ICO:Information Commissioner&apos;s Office (ICO)Online Complaint Form: https://ico.org.uk/make-a-complaint/Helpline: 0303 123 1113 (Mon-Fri, 9am-5pm)Post: Information Commissioner&apos;s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF4.1 What to Include in Your ICO ComplaintOur organization name: Defence Legal Services LtdOur ICO registration number: ZA198500Nature of your data protection concernSteps you&apos;ve already taken (.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">5. Our Commitment</h2>
            <p className="text-[var(--muted)] leading-relaxed">5.1 We are committed to:Maintaining ICO registration in good standingCooperating fully with ICO investigationsImplementing ICO recommendations promptlyContinuous improvement of data protection practicesTransparency in all data processing activitiesFor comprehensive information on how we process your data, please see our Privacy Policy, GDPR Policy, and Data Protection Policy.Reps DirectoryFind accredited repsBrowseStation ContactsPhone numbersSearchForms LibraryLegal aid formsAccessResourcesLegal guidanceExplore.</p>
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
