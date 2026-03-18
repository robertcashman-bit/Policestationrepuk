import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Magistrates\' Court Legal Aid Fee Rates | PoliceStationRepUK',
  description: 'Legal aid payment rates for representation in the magistrates\' court under the Standard Fee schemeSource: The Criminal Legal Aid (Remuneration) Regulations',
  path: '/MagistratesCourtFees',
});

export default function MagistratesCourtFeesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Magistrates\' Court Legal Aid Fee Rates' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Magistrates&apos; Court Standard Fees</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">Legal aid payment rates for representation in the magistrates&apos; court under the Standard Fee schemeSource: The Criminal Legal Aid (Remuneration) Regulations 2013 (SI 2013/435), Schedule 4, paragraph 5, as amended by SI 2025/1251. All figures verified </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">How the Standard Fee Scheme Works</h2>
            <p className="text-[var(--muted)] leading-relaxed">Magistrates&apos; court representation is paid under a Standard Fee scheme.</p>
            <p className="text-[var(--muted)] leading-relaxed">Each case falls into a category (1A, 1B, or 2) and an area type (Designated or Undesignated).</p>
            <p className="text-[var(--muted)] leading-relaxed">For each combination, there is a Lower Standard Fee and a Higher Standard Fee, each with an associated fee limit.Step 1: Record all time at the hourly rates in the table below.Step 2: Calculate the total costs (profit costs) from your time recording.Step 3: Compare your total costs against the fee limits:If your costs are at or below the Lower Standard Fee Limit → you claim the Lower Standard FeeIf your costs exceed the Lower Standard Fee Limit but are at or below the Higher Standard Fee Limit → you claim the Higher Standard FeeIf your costs exceed the Higher Standard Fee Limit → you claim your actual assessed costs (i.e.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Hourly Rates for Time Recording</h2>
            <p className="text-[var(--muted)] leading-relaxed">These rates apply in all areas.</p>
            <p className="text-[var(--muted)] leading-relaxed">They are used for recording time (to determine which standard fee band applies) and for calculating costs in cases that fall outside the standard fee scheme.Work TypeRate (All Areas)Routine letters written and telephone calls£4.50 per itemPreparation£57.37 per hourAdvocacy (including applications for bail and other applications to the court)£71.96 per hourAttendance at court where Counsel is assigned (including conferences with Counsel at court)£39.25 per hourTravelling and waitingOnly claimable where the undesignated area fees apply£30.36 per hourSource: Schedule 4, paragraph 5(1), table.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Standard Fees — Higher and Lower</h2>
            <p className="text-[var(--muted)] leading-relaxed">The fee you claim depends on the category of case and whether the court is in a designated or undesignated area.Designated Area Standard FeesCategoryLower Standard FeeLower Fee LimitHigher Standard FeeHigher Fee LimitCategory 1A£314.62£344.51£596.84£596.89Category 1B£255.78£344.51£551.09£596.89Category 2£436.85£591.82£915.04£986.25Undesignated Area Standard FeesCategoryLower Standard FeeLower Fee LimitHigher Standard FeeHigher Fee LimitCategory 1A£246.27£344.51£521.57£596.89Category 1B£200.21£344.51£481.59£596.89Category 2£353.51£591.82£810.79£986.25Source: Schedule 4, paragraph 5(2), Higher and Lower Standard Fees table.Additional fee (paragraph 5(6)): For cases which fall outside the Standard Fee payment scheme, an additional fee of £229.47 may be claimed.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Category Definitions</h2>
            <p className="text-[var(--muted)] leading-relaxed">Which category a case falls into depends on the nature of the proceedings (paragraph 5(3)).Category 1AEither-way (non-trial)•Either-way guilty pleas•Guilty pleas for low-value shoplifting (s.22A(3) MCA 1980)•Either-way offences discontinued, withdrawn, or where prosecution offer no evidence•Either-way offences resulting in a bind over•Deferred sentence proceedings (either-way or low-value shoplifting)Category 1BSummary (non-trial)•Summary only guilty pleas•Uncontested breach proceedings (including Crown Court community orders / suspended sentences)•Summary offences discontinued, withdrawn, or NE•Summary offences resulting in a bind over•Deferred sentence proceedings (summary offences)•Regulation 9 proceedings (unless listed and fully prepared for contested hearing)Category 2Contested / Tri.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Designated vs Undesignated Areas</h2>
            <p className="text-[var(--muted)] leading-relaxed">Designated areas attract higher standard fees.</p>
            <p className="text-[var(--muted)] leading-relaxed">They are defined in the Standard Crime Contract and generally correspond to urban areas with higher operating costs.Undesignated areas attract lower standard fees but allow travel and waiting time to be claimed at £30.36 per hour (which is not claimable in designated areas).The designated/undesignated classification of a court is set out in the 2025 Standard Crime Contract.</p>
            <p className="text-[var(--muted)] leading-relaxed">Check your contract documentation or ask your contract manager if you are unsure which applies.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Escaping the Standard Fee</h2>
            <p className="text-[var(--muted)] leading-relaxed">If your assessed profit costs exceed the Higher Standard Fee Limit for the relevant category and area, you &quot;escape&quot; the standard fee scheme and claim your actual assessed costs calculated at the hourly rates above.Higher Standard Fee Limits (escape thresholds)Categories 1A and 1B:£596.89Category 2:£986.25These limits are the same for designated and undesignated areas.You must maintain detailed time records throughout every case — not just those you expect to escape.</p>
            <p className="text-[var(--muted)] leading-relaxed">Time recording is required to determine which fee band applies.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Important Notes</h2>
            <p className="text-[var(--muted)] leading-relaxed">Youth Court: Representation in the youth court has its own fee scheme under paragraph 5B of Schedule 4.</p>
            <p className="text-[var(--muted)] leading-relaxed">The hourly rates are the same, but the standard fee amounts and categories differ.</p>
            <p className="text-[var(--muted)] leading-relaxed">See the legislation for details.VAT: All figures shown are exclusive of VAT.</p>
            <p className="text-[var(--muted)] leading-relaxed">VAT-registered providers should add VAT at the prevailing rate.Disbursements: Reasonable disbursements (e.g.</p>
            <p className="text-[var(--muted)] leading-relaxed">expert fees, interpreters) are claimed separately and are not included within the standard fee.</p>
            <p className="text-[var(--muted)] leading-relaxed">Prior authority may be required for non-standard disbursements.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Official Resources</h2>
            <p className="text-[var(--muted)] leading-relaxed">SI 2013/435, Schedule 4, Paragraph 5The primary legislation setting out magistrates&apos; court representation fees (latest revised version).View on legislation.gov.uk SI 2025/1251 (Amendment Regulations)The 2025 amendment regulations that updated the fee amounts shown on this page.View on legislation.gov.uk.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Related Pages</h2>
            <p className="text-[var(--muted)] leading-relaxed">Police Station RatesFixed fees, escape thresholds and hourly rates for police station workView Rates →Crown Court FeesGraduated fees for Crown Court representationView Fees →Escape Fee CalculatorCalculate whether your police station case escapes the fixed feeUse Calculator →Disclaimer: This page is provided for information only and does not constitute legal or financial advice.</p>
            <p className="text-[var(--muted)] leading-relaxed">While every effort has been made to ensure accuracy by referencing the primary legislation directly, always verify current rates with the Legal Aid Agency and your contract documentation before submitting claims.</p>
            <p className="text-[var(--muted)] leading-relaxed">The legislation may be further amended after the date of this page.</p>
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
