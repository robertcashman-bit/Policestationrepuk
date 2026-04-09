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
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/90">
            A curated directory of accredited freelance police station representatives for
            instructing solicitors. Get discovered by criminal defence firms, receive more cover
            requests, and grow your freelance practice — completely free.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-xl font-bold text-[var(--navy)]">Benefits of Joining</h2>
            <ul className="mt-4 space-y-3 text-[var(--foreground)]">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-600">✓</span> Get listed in the UK&rsquo;s leading police station representative directory</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-600">✓</span> Increase your instructions from criminal defence firms</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-600">✓</span> Professional profile visible to solicitors searching by county or station</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-600">✓</span> Completely free — no fees, ever</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-600">✓</span> Takes 2–3 minutes to register</li>
            </ul>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-emerald-700 p-8 text-center">
            <h2 className="text-xl font-bold text-white">Ready to Get Listed?</h2>
            <p className="mt-2 text-white/90">
              Create your free profile now and start receiving instructions from criminal defence firms.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-lg)] bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-md no-underline transition-colors hover:bg-emerald-50">
                Create My Free Profile
              </Link>
            </div>
          </section>

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
