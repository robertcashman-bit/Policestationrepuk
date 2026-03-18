import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Training Resources | PoliceStationRepUK',
  description: 'HomeTraining ResourcesTraining Guides & ResourcesAll training guides, Rep Wiki, and resources — completely free for all usersFree for EveryoneComplete "Get',
  path: '/Subscribe',
});

export default function SubscribePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Training Resources' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Training Guides &amp; Resources</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">HomeTraining ResourcesTraining Guides &amp; ResourcesAll training guides, Rep Wiki, and resources — completely free for all usersFree for EveryoneComplete &quot;Get Work as a Rep&quot; Guide6-phase roadmap to £40k-£80k+ annual incomeFull Rep Wiki Access8 categorie</p>
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
