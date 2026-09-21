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
  WHY_ACCREDITED_CAREER,
  WHY_ACCREDITED_FAQS,
  WHY_ACCREDITED_FIRM_POINTS,
  WHY_ACCREDITED_MEANINGS,
  WHY_ACCREDITED_ON_THIS_PAGE,
  WHY_ACCREDITED_REASONS,
  WHY_ACCREDITED_RELATED,
  WHY_ACCREDITED_STUCK,
  WHY_ACCREDITED_WITHOUT,
} from '@/lib/guide-why-get-accredited';

export const metadata = buildMetadata({
  title: 'Why Get Police Station Accredited? | Motivation & Career Value',
  description:
    'Stuck mid-PSRAS or scared of the CIT? Why police station accreditation makes you more valuable to crime firms, harder to replace, and puts you on the path toward criminal solicitor work — England & Wales.',
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
        description="If you’re stuck halfway through — failed a paper, scared of the CIT, can’t find a supervisor, or quietly put it off for months — this is your nudge. You are closer than it feels."
        updated="21 September 2026"
      />
      <StructuredGuideShell
        sourcesContext={{ kind: 'page', path: '/WhyGetPoliceStationAccredited' }}
        promo={<PsrTrainPromo className="mb-10" campaign="why_get_accredited" />}
      >
        <GuideToc items={WHY_ACCREDITED_ON_THIS_PAGE} />

        <section className="mb-12">
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Accreditation is how you stop being “helpful around the office” and become someone a
            crime firm can actually put into a police station under Legal Aid rules. Hard? Yes.
            Worth it? Absolutely. Finish it, and you change what firms see when they look at you.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            This is a national guide for paralegals, trainees, newly qualified solicitors and
            career-changers across England and Wales. It is <strong className="text-[var(--navy)]">not</strong> an
            exam course — it’s the “keep going, here’s why it matters” page. For the mechanics, use
            the{' '}
            <Link
              href="/HowToBecomePoliceStationRep"
              className="font-semibold text-[var(--navy)] underline"
            >
              full PSRAS route guide
            </Link>{' '}
            and the stage guides linked below.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="what-it-means">
            What “police station accredited” means
          </GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            People say “accredited” when they mean three different things. Nail this and you stop
            wasting energy on the wrong mountain:
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
          <GuideSectionHeading id="why-firms">
            Why firms want you accredited — and why they keep you
          </GuideSectionHeading>
          <div className="mt-6 space-y-4">
            {WHY_ACCREDITED_FIRM_POINTS.map((item) => (
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
          <GuideSectionHeading id="push-through">Reasons to push through</GuideSectionHeading>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {WHY_ACCREDITED_REASONS.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ol>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-[var(--navy)]">
            You deserve to be on that side of the glass.
          </p>
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
            become someone the firm builds around.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="career">Career upside</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {WHY_ACCREDITED_CAREER.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            Broader qualification routes:{' '}
            <Link
              href="/CriminalLawCareerGuide"
              className="font-semibold text-[var(--navy)] underline"
            >
              Criminal Law Career Guide
            </Link>
            .
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="stuck">
            What’s stopping you (if you’re finding it brutally hard)
          </GuideSectionHeading>
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
          <p className="mt-4 text-sm font-semibold leading-relaxed text-[var(--navy)]">
            You’re allowed to find this hard. You’re also allowed — and ready — to finish it.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="next-steps">Next steps</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-3 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              <strong className="text-[var(--navy)]">Exam prep:</strong> structured practice on{' '}
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
              <Link href="/FindSupervisingSolicitor" className="font-semibold text-[var(--navy)] underline">
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
