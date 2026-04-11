import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Media Kit & Advertising — PoliceStationRepUK Partners',
  description:
    'Advertise on PoliceStationRepUK. Audience insights, traffic stats, sponsorship formats, and partnership opportunities for legal-sector brands targeting criminal defence professionals.',
  path: '/MediaKit',
});

const STATS = [
  { label: 'Active users / month', value: '2,000+', note: 'Indicative — request current figures' },
  { label: 'Page views / month', value: '10,000+', note: 'Indicative — request current figures' },
  { label: 'Avg. session', value: '4+ min', note: 'Engaged professional readership' },
];

export default function MediaKitPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Media Kit & Press' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Media kit</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            Audience insights, advertising formats, and partnership opportunities for brands that serve criminal defence
            teams, police station representatives, and duty solicitors.
          </p>
          <ul className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3" aria-label="Audience highlights">
            {STATS.map((s) => (
              <li
                key={s.label}
                className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-center backdrop-blur-sm"
              >
                <span className="block text-2xl font-bold text-[var(--gold)]">{s.value}</span>
                <span className="mt-1 block text-xs font-medium text-white">{s.label}</span>
                <span className="mt-1 block text-[11px] text-slate-400">{s.note}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-sm text-slate-300">
            Primary audience: accredited police station representatives, duty solicitors, and criminal defence solicitors
            in England and Wales.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Request the full media kit</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              For detailed demographics, rate card, placements, and case studies, contact us. We will send the latest
              pack and can arrange a short call to match formats to your goals.
            </p>
            <p>
              <Link
                href="/Contact"
                className="inline-flex font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2 hover:text-[var(--gold-hover)]"
              >
                Contact us for the full media kit →
              </Link>
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Directory &amp; support</h2>
            <p className="mt-2 text-slate-300">
              Looking for reps or general help with the site? Use the directory or contact page.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a rep
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
