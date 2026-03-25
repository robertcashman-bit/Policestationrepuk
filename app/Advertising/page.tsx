import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Advertising & Sponsorship | PoliceStationRepUK',
  description: 'Looking to advertise your representative profile?This page is for third-party advertising partners (legal tech, training providers, etc.).Police station re',
  path: '/Advertising',
});

export default function AdvertisingPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Advertising & Sponsorship' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Partner Advertising Opportunities</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">Looking to advertise your representative profile?This page is for third-party advertising partners (legal tech, training providers, etc.).Police station reps:Please visit our Become a Featured Rep page for profile upgrade options.Partner Advertising </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">


          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-2 text-white">
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
