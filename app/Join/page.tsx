import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Join the PoliceStationRepUK Directory — Free for Reps',
  description: 'Join the UK\u2019s free police station representative directory. Get your profile seen by criminal defence solicitors, receive cover requests, and grow your freelance rep practice at zero cost.',
  path: '/Join',
});

export default function JoinPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Join' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Join Our Professional Directory</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">Join Our Professional DirectoryA private, curated list of accredited freelance reps for instructing solicitors.Benefits of JoiningGet listed in a solicitor-only directory.Increase your instructions from criminal law firms.No public contact, only prof</p>
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
