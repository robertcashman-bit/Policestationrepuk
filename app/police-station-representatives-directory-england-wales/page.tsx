import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Representatives Directory for Criminal Defence Firms | PoliceStationRepUK',
  description: 'Police Station Representatives Directory for Criminal Defence Firms in England & WalesPoliceStationRepUK is a national directory used by criminal defence f',
  path: '/police-station-representatives-directory-england-wales',
});

export default function policestationrepresentativesdirectoryenglandwalesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Police Station Representatives Direct...' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Police Station Representatives Directory for Criminal Defence Firms in England &amp; Wales</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">Police Station Representatives Directory for Criminal Defence Firms in England &amp; WalesPoliceStationRepUK is a national directory used by criminal defence firms to locate police station representatives when external cover is required.The directory sup</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">


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
