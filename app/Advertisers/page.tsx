import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Advertisers | PoliceStationRepUK',
  description: 'Promote your legal tech, training, or professional services to our engaged community of criminal defence professionalsOur AudienceEngagedCriminal Defence P',
  path: '/Advertisers',
});

export default function AdvertisersPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Advertisers' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Partner Advertising</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">Promote your legal tech, training, or professional services to our engaged community of criminal defence professionalsOur AudienceEngagedCriminal Defence ProfessionalsNationwideEngland &amp; Wales Coverage100%Legal Sector Focus*Reach figures available in</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Advertising Options</h2>
            <p className="text-[var(--muted)] leading-relaxed">Flexible formats to suit your marketing goalsBanner AdvertisingPremium placements on high-traffic pages including homepage, directory and resources.Header and sidebar positionsResponsive across all devicesMonthly analytics reportsSponsored ContentFeatured articles, case studies and thought leadership content for your brand.Blog integration and promotionNewsletter featuresSocial media amplificationWho Advertises With Us?Legal TechnologyCase management, billing software, practice management toolsTraining ProvidersCPD courses, accreditation programs, professional developmentProfessional ServicesExpert witnesses, translators, forensic servicesLegal PublishersLaw books, journals, research databasesReady to reach your audience?Contact us for a media kit, audience analytics, and custom pricing pa.</p>
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
