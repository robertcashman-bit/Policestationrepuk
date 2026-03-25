import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Media Kit & Advertising — PoliceStationRepUK Partners',
  description: 'Advertise on PoliceStationRepUK. Audience insights, monthly traffic stats, sponsorship formats, and partnership opportunities for legal-sector brands targeting criminal defence professionals.',
  path: '/MediaKit',
});

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
          <h1 className="mt-3 text-h1 text-white">Media Kit</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">Audience insights, advertising formats and partnership opportunitiesOur Audience2,000+Active Users/Month10,000+Page Views/Month4.2 minAvg. Session DurationPrimary Audience: Police station representatives, duty solicitors, criminal defence solicitorsG</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Request Full Media Kit</h2>
            <p className="text-[var(--muted)] leading-relaxed">Get detailed audience demographics, rates and case studiesContact Us for Full Kit.</p>
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
