import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Crown Court Legal Aid Fee Rates | PoliceStationRepUK',
  description: 'Litigator and Advocacy Graduated Fee Scheme (AGFS) for Crown Court representationComplex Fee Scheme: Crown Court fees are calculated using graduated fee ta',
  path: '/CrownCourtFees',
});

export default function CrownCourtFeesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Crown Court Legal Aid Fee Rates' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Crown Court Fees</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">Litigator and Advocacy Graduated Fee Scheme (AGFS) for Crown Court representationComplex Fee Scheme: Crown Court fees are calculated using graduated fee tables based on case class, pages of prosecution evidence (PPE), and trial length. This page prov</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Understanding the Graduated Fee Scheme</h2>
            <p className="text-[var(--muted)] leading-relaxed">Litigator FeesPaid to the solicitor firm for all case preparation work including:•Initial instructions and client conferences•Reviewing prosecution evidence (PPE)•Defence case preparation•Witness liaison and proof taking•Instructing counsel•All administrative workAdvocacy Fees (AGFS)Paid to the advocate (barrister or solicitor advocate) for court appearances:•PTPH (Plea and Trial Preparation Hearing)•Pre-trial hearings and mentions•Trial advocacy•Sentencing hearings•Appeals•Preparation for advocacyKey Point: Both litigator and advocacy fees are paid separately for the same case.</p>
            <p className="text-[var(--muted)] leading-relaxed">If a solicitor-advocate does their own advocacy, they receive both fees.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Offence Classification System</h2>
            <p className="text-[var(--muted)] leading-relaxed">Crown Court offences are divided into classes A-K, with higher class letters generally attracting higher fees.</p>
            <p className="text-[var(--muted)] leading-relaxed">The class determines the base fee and PPE rates.High Value ClassesClass AMurder and relatedMurder, manslaughter, infanticide, child destructionClass BSerious violence &amp; sexualGBH with intent, rape, aggravated burglary, robbery, kidnappingClass CLesser violenceGBH s.20, ABH with weapon, violent disorderClass DSexual offencesSexual assault, child sex offences, grooming, indecent imagesStandard ClassesClass HFraud &amp; financialFraud, money laundering, false accounting, bankruptcy offencesClass IDrugs (supply)Production, supply, PWITS Class A/BClass JSerious propertyBurglary dwelling, arson, aggravated vehicle takingClass KOther offencesTheft, handling, criminal damage, possession drugs.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">How Fees Are Calculated</h2>
            <p className="text-[var(--muted)] leading-relaxed">Case ClassOffence class (A-K) determines the base fee rate and category2.</p>
            <p className="text-[var(--muted)] leading-relaxed">PPE CountPages of Prosecution Evidence - each page over baseline adds to the fee3.</p>
            <p className="text-[var(--muted)] leading-relaxed">Case TypeTrial, cracked trial, guilty plea, or appeal - each has different fee structurePages of Prosecution Evidence (PPE)What Counts as PPE?✓ Statements, exhibits, interview transcripts✓ Police reports and summaries✓ Expert reports (prosecution)✓ Schedules and unused material✓ Medical records (if disclosed)What Doesn&apos;t Count?✗ Defence statements or evidence✗ Counsel&apos;s advice or notes✗ Correspondence between parties✗ Court documents (indictment, etc.)✗ Blank or cover pages.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Typical Fee Examples (Approximations)</h2>
            <p className="text-[var(--muted)] leading-relaxed">Important: These are rough estimates only.</p>
            <p className="text-[var(--muted)] leading-relaxed">Actual fees vary significantly based on PPE, trial days, and specific circumstances.</p>
            <p className="text-[var(--muted)] leading-relaxed">Always use the official LAA calculator for accurate amounts.Example 1: Class K Guilty PleaCase Details:• Offence: Theft from shop (Class K)• Outcome: Guilty plea at PTPH• PPE: 50 pagesLitigator Fee (approx):£400-600Advocacy Fee (PTPH):£250-350Estimated Total:£650-950Example 2: Class B Trial (5 days)Case Details:• Offence: Robbery (Class B)• Outcome: 5-day trial, conviction• PPE: 250 pagesLitigator Fee (approx):£3,500-5,000Advocacy Fee (5 days):£4,000-6,000Estimated Total:£7,500-11,000Example 3: Class D Cracked TrialCase Details:• Offence: Sexual assault (Class D)• Outcome: Guilty plea on day of trial• PPE: 150 pagesLitigator Fee (approx):£2,000-3,000Advocacy Fee (.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Special Fees &amp; Uplifts</h2>
            <p className="text-[var(--muted)] leading-relaxed">Conferences &amp; ViewsAdditional fees for out-of-court conferences and site views (not included in graduated fee):Conference with counsel£52.15 per hour (prep rate)Site view£52.15 per hour + travelQC/KC Led CasesWhen a QC/KC is instructed as lead counsel, junior counsel receives a reduced advocacy fee (typically 50-70% of standard graduated fee).Wasted Preparation FeeIf a trial cracks late or is re-listed, additional preparation fees may be claimed for wasted work.</p>
            <p className="text-[var(--muted)] leading-relaxed">Requires detailed justification and supporting evidence.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Very High Cost Cases (VHCC)</h2>
            <p className="text-[var(--muted)] leading-relaxed">Cases with estimated costs exceeding £150,000 are classified as Very High Cost Cases (VHCC) and are removed from the graduated fee scheme.</p>
            <p className="text-[var(--muted)] leading-relaxed">These are individually negotiated contracts.VHCC Criteria• Complex fraud/conspiracy cases• Multiple defendants (5+)• Thousands of pages of evidence• International element• Lengthy trial estimate (4+ weeks)• Expert evidence complexityVHCC Process• Early identification essential• Individual case contract• Hourly rates + disbursements• Regular billing/review• LAA case manager assigned.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Official Resources &amp; Tools</h2>
            <p className="text-[var(--muted)] leading-relaxed">LAA Fee CalculatorEssential tool - calculates exact graduated fees based on your case details.</p>
            <p className="text-[var(--muted)] leading-relaxed">Use this before submitting any claim.Access Calculator 2024 AGFS SchemeThe official Advocates&apos; Graduated Fee Scheme order with all rates and fee tables.View on GOV.UK Litigators Graduated Fee SchemeThe official LGFS order detailing solicitor litigator fee calculations.View on GOV.UK Offence Class CalculatorFind the correct offence class for your case using the LAA&apos;s classification tool.View Guidance Sources &amp; DisclaimerAll information based on the Advocates&apos; Graduated Fee Scheme (AGFS) and Litigators&apos; Graduated Fee Scheme (LGFS) as set out in The Criminal Legal Aid (Remuneration) Regulations 2013 (SI 2013/435) as amended.Fee examples are approximations only - actual graduated fees vary significan.</p>
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
