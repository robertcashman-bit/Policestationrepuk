import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Swanley Police Station Representatives | North Kent Reps',
  description: 'Find accredited police station representatives covering Swanley and North Kent. Reliable custody rep cover and accredited representative attendance for private client instructions at Swanley police station.',
  path: '/SwanleyPoliceStationReps',
});

export default function SwanleyPoliceStationRepsPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'SwanleyPoliceStationReps' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">SwanleyPoliceStationReps</h1>

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
