import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Kent Agent Cover — Police Station Rep Attendance Kent',
  description:
    'Police station rep cover across Kent for law firms. Find accredited representatives for custody attendance via the free directory.',
  path: '/KentAgentCover',
});

const WHY = [
  { title: '24/7 demand', detail: 'Custody runs overnight and at weekends — firms often need accredited reps outside core hours.' },
  { title: 'Kent-wide coverage', detail: 'Maidstone, Medway, Folkestone, Margate, Tonbridge, and other hubs — match reps to the suite you need.' },
  { title: 'Accreditation visible', detail: 'Listings show accreditation-type signals so you can shortlist before you call.' },
  { title: 'Direct contact', detail: 'Where published, phone and email let you arrange cover without a middleman.' },
];

const STEPS = [
  { step: '1', title: 'Browse the directory', detail: 'Open the Kent hub and filter by availability or stations relevant to your case.' },
  { step: '2', title: 'Contact the rep', detail: 'Call or message to confirm conflict checks, terms, and attendance time.' },
  { step: '3', title: 'Confirm on the ground', detail: 'Rep attends the custody suite as agreed — your firm remains responsible for instruction.' },
];

export default function KentAgentCoverPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Kent agent cover' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Kent agent cover</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            Reliable police station representation for solicitor firms across Kent — search accredited representatives,
            then agree terms and conflicts in the usual way.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">For solicitors needing cover in Kent</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              When you need overnight attendance, weekend overflow, or extra capacity, use the directory to find reps who
              publish Kent coverage. PoliceStationRepUK does not employ reps or guarantee availability — it is a discovery
              layer only.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Why firms use the directory</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {WHY.map((w) => (
                <li key={w.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="font-bold text-[var(--navy)]">{w.title}</span>
                  <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{w.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Custody suites</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Kent operates several main custody hubs. See{' '}
              <Link href="/KentCustodySuites" className="font-semibold text-[var(--navy)] underline">
                Kent custody suites
              </Link>{' '}
              for an overview. Always confirm the live booking location with custody staff.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Typical workflow</h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((s) => (
                <li key={s.step} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-sm font-bold text-white">
                    {s.step}
                  </span>
                  <div>
                    <p className="font-bold text-[var(--navy)]">{s.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Frequently asked questions</h2>
            <dl className="space-y-4 text-[var(--muted)] leading-relaxed">
              <div>
                <dt className="font-bold text-[var(--navy)]">What is agent cover?</dt>
                <dd className="mt-1">
                  An accredited representative attends on behalf of your firm under your instruction — common for
                  unsocial hours or capacity gaps.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">How do I find cover in Kent?</dt>
                <dd className="mt-1">
                  Start at the{' '}
                  <Link href="/directory/kent" className="font-semibold text-[var(--navy)] underline">
                    Kent directory hub
                  </Link>
                  .
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">National cover</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              <Link href="/SolicitorPoliceStationCoverUK" className="font-semibold text-[var(--navy)] underline">
                Police station cover for solicitors (UK)
              </Link>{' '}
              — all regions.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Find Kent reps</h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory/kent" className="btn-gold no-underline">
                Kent directory
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
