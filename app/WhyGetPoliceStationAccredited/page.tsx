import Link from 'next/link';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import {
  GuideFaqs,
  GuideHero,
  GuideRelated,
  GuideSectionHeading,
  GuideToc,
  StructuredGuideShell,
} from '@/components/StructuredGuideLayout';
import { PSRTRAIN_HOME_HREF, PSRTRAIN_NAME } from '@/lib/psrtrain-promo';
import { buildMetadata } from '@/lib/seo';
import {
  WHY_ACCREDITED_FAQS,
  WHY_ACCREDITED_FEE_EARNER,
  WHY_ACCREDITED_MEANINGS,
  WHY_ACCREDITED_ON_THIS_PAGE,
  WHY_ACCREDITED_PORTFOLIO_THROUGH,
  WHY_ACCREDITED_PORTFOLIO_WHY_HARD,
  WHY_ACCREDITED_PORTFOLIO_WHY_STALL,
  WHY_ACCREDITED_REASONS,
  WHY_ACCREDITED_RELATED,
  WHY_ACCREDITED_RETENTION,
  WHY_ACCREDITED_STUCK,
  WHY_ACCREDITED_WITHOUT,
} from '@/lib/guide-why-get-accredited';

export const metadata = buildMetadata({
  title: 'Why Get Police Station Accredited? | Fee Earner Value & Motivation',
  description:
    'Why finish PSRAS: become a fee earner in your own right, more valuable to crime firms, and push through the hard portfolio stage — honest motivation for England & Wales.',
  path: '/WhyGetPoliceStationAccredited',
});

export default function WhyGetPoliceStationAccreditedPage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'For Reps', href: '/RepsHub' },
          { label: 'Why get accredited' },
        ]}
        title="Why get police station accredited?"
        description="Finish accreditation and you stop being “just a paralegal.” You become a fee earner crime firms can send to custody — more valuable, harder to replace, and on a real criminal-defence pathway. Hardest stretch for many? The portfolio. This page is the honest nudge to get through it."
        updated="21 September 2026"
      />
      <StructuredGuideShell
        sourcesContext={{ kind: 'page', path: '/WhyGetPoliceStationAccredited' }}
        promo={<PsrTrainPromo className="mb-10" campaign="why_get_accredited" />}
      >
        <GuideToc items={WHY_ACCREDITED_ON_THIS_PAGE} />

        <section className="mb-12">
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Accreditation is how you change what a crime firm sees when it looks at you: from
            helpful support to someone who can advise at the police station under Legal Aid rules.
            Hard? Yes — especially portfolio preparation and completion. Worth it? Absolutely.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            This is a national guide for paralegals, trainees, newly qualified solicitors and
            career-changers across England and Wales. It is{' '}
            <strong className="text-[var(--navy)]">not</strong> an exam syllabus dump — it’s the
            “keep going, here’s why it matters” page. For the mechanics, use the{' '}
            <Link
              href="/HowToBecomePoliceStationRep"
              className="font-semibold text-[var(--navy)] underline"
            >
              full PSRAS route guide
            </Link>
            , the{' '}
            <Link href="/BuildPortfolioGuide" className="font-semibold text-[var(--navy)] underline">
              portfolio guide
            </Link>
            , and the other stage guides linked below.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="what-it-means">
            What “police station accredited” means
          </GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            People say “accredited” when they mean three different things. Nail this and you stop
            climbing the wrong ladder:
          </p>
          <div className="mt-6 space-y-4">
            {WHY_ACCREDITED_MEANINGS.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            Deep dive on register status:{' '}
            <Link
              href="/AccreditedRepresentativeGuide"
              className="font-semibold text-[var(--navy)] underline"
            >
              Accredited Representative Guide
            </Link>
            . Duty vs rep careers:{' '}
            <Link href="/DutySolicitorVsRep" className="font-semibold text-[var(--navy)] underline">
              Duty solicitor vs rep
            </Link>
            .
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="fee-earner">
            Fee earner in your own right — not “just a paralegal”
          </GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Firms pay you more when you’re accredited because you generate police-station work
            yourself. You’re a fee earner in your own right — not only someone who supports a
            solicitor’s diary.
          </p>
          <div className="mt-6 space-y-4">
            {WHY_ACCREDITED_FEE_EARNER.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            For how rates and claims work in outline (not personal salary advice), see{' '}
            <Link href="/PoliceStationRates" className="font-semibold text-[var(--navy)] underline">
              police station rates
            </Link>{' '}
            and{' '}
            <Link href="/PoliceStationRepPay" className="font-semibold text-[var(--navy)] underline">
              rep pay context
            </Link>
            . We don’t invent figures on this page.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="retention">
            More valuable — and harder to get rid of
          </GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Stay professional about this: accreditation doesn’t make anyone “untouchable.” It does
            make you economically useful. Firms that have invested in getting you through prefer to
            keep people who already generate cover.
          </p>
          <div className="mt-6 space-y-4">
            {WHY_ACCREDITED_RETENTION.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="reasons">Strong reasons to finish</GuideSectionHeading>
          <div className="mt-6 space-y-4">
            {WHY_ACCREDITED_REASONS.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            Broader solicitor pathways:{' '}
            <Link
              href="/CriminalLawCareerGuide"
              className="font-semibold text-[var(--navy)] underline"
            >
              Criminal Law Career Guide
            </Link>
            . You deserve to be on that side of the glass.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="portfolio">
            The hard part: portfolio preparation and completion
          </GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Let’s deal with this openly. For many candidates, the portfolio is the hardest stretch
            of the whole route — harder than the written paper for some, harder than the CIT for
            others — because it stretches over months of real attendances, supervision, and
            write-ups. People don’t usually quit on day one; they stall mid-portfolio.
          </p>

          <h3 className="mt-8 text-lg font-bold text-[var(--navy)]">Why it’s hard</h3>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {WHY_ACCREDITED_PORTFOLIO_WHY_HARD.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="mt-8 text-lg font-bold text-[var(--navy)]">Why people stall</h3>
          <div className="mt-4 space-y-4">
            {WHY_ACCREDITED_PORTFOLIO_WHY_STALL.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h4 className="font-bold text-[var(--navy)]">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-8 text-lg font-bold text-[var(--navy)]">How to get through it</h3>
          <div className="mt-4 space-y-4">
            {WHY_ACCREDITED_PORTFOLIO_THROUGH.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h4 className="font-bold text-[var(--navy)]">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">
            Start here for the blueprint:{' '}
            <Link href="/BuildPortfolioGuide" className="font-semibold text-[var(--navy)] underline">
              Build your portfolio guide
            </Link>
            . Then lock the other stages:{' '}
            <Link
              href="/PrepareForWrittenExam"
              className="font-semibold text-[var(--navy)] underline"
            >
              written exam
            </Link>
            ,{' '}
            <Link href="/PrepareForCIT" className="font-semibold text-[var(--navy)] underline">
              CIT
            </Link>
            ,{' '}
            <Link
              href="/DSCCRegistrationGuide"
              className="font-semibold text-[var(--navy)] underline"
            >
              DSCC registration
            </Link>
            , and{' '}
            <Link
              href="/FindSupervisingSolicitor"
              className="font-semibold text-[var(--navy)] underline"
            >
              finding a supervising solicitor
            </Link>
            . We don’t invent extra LAA or PSRAS rules on this page — follow those guides and your
            assessment organisation handbook.
          </p>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-[var(--navy)]">
            You’re allowed to find the portfolio brutal. You’re also allowed — and ready — to finish
            the next case.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="stuck">Other sticking points</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Portfolio isn’t the only place people freeze. If one of these is your blocker, name it
            and take one step this week:
          </p>
          <div className="mt-6 space-y-4">
            {WHY_ACCREDITED_STUCK.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="without-it">What if you don’t?</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Honest framing — not invented scare stories:
          </p>
          <ul className="mt-4 list-disc space-y-3 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {WHY_ACCREDITED_WITHOUT.map((item) => (
              <li key={item.title}>
                <strong className="text-[var(--navy)]">{item.title}.</strong> {item.body}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            Translation: without it, meaningful station work stays with other people. With it, you
            become someone the firm can build cover around.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="next-steps">Next steps</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-3 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              <strong className="text-[var(--navy)]">
                Portfolio first if that’s where you’re stuck:
              </strong>{' '}
              open the{' '}
              <Link href="/BuildPortfolioGuide" className="font-semibold text-[var(--navy)] underline">
                portfolio guide
              </Link>{' '}
              and finish one case write-up this week.
            </li>
            <li>
              <strong className="text-[var(--navy)]">Exam / CIT prep:</strong> structured practice on{' '}
              <a
                href={PSRTRAIN_HOME_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline"
              >
                {PSRTRAIN_NAME}
              </a>{' '}
              — timed MCQs and CIT-style scenarios. This page is not a full course; the promo below
              is the short route into prep.
            </li>
            <li>
              <strong className="text-[var(--navy)]">Find firms / directory:</strong>{' '}
              <Link href="/directory" className="font-semibold text-[var(--navy)] underline">
                PoliceStationRepUK directory
              </Link>
              ,{' '}
              <Link
                href="/FindSupervisingSolicitor"
                className="font-semibold text-[var(--navy)] underline"
              >
                supervising solicitor guide
              </Link>
              , and{' '}
              <Link
                href="/legal-services-directory/category/solicitors"
                className="font-semibold text-[var(--navy)] underline"
              >
                criminal defence solicitors (LAA directory)
              </Link>
              .
            </li>
            <li>
              <strong className="text-[var(--navy)]">Serious crime practice context:</strong>{' '}
              national firms such as{' '}
              <a
                href="https://www.tuckerssolicitors.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline"
              >
                Tuckers Solicitors LLP
              </a>{' '}
              illustrate the scale of criminal defence work in England and Wales. We do not invent
              job offers here — check firm careers pages and apply through proper channels if that
              path interests you.
            </li>
            <li>
              <strong className="text-[var(--navy)]">Rep tools hub:</strong>{' '}
              <Link href="/RepsHub" className="font-semibold text-[var(--navy)] underline">
                RepsHub
              </Link>{' '}
              and the{' '}
              <Link href="/Resources" className="font-semibold text-[var(--navy)] underline">
                Knowledge Centre
              </Link>
              .
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="faqs">Frequently asked questions</GuideSectionHeading>
          <GuideFaqs faqs={WHY_ACCREDITED_FAQS} />
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={WHY_ACCREDITED_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
