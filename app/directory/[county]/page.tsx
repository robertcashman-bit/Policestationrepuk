import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCountyBySlug, getRepsByCounty, getStationsByCounty } from '@/lib/data';
import { getCountyContent } from '@/lib/counties-content';
import { buildMetadata, legalServiceSchema, breadcrumbSchema, placeSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DirectoryCard } from '@/components/DirectoryCard';
import { StationCard } from '@/components/StationCard';

export const dynamic = 'force-static';
export const revalidate = false;

interface PageProps {
  params: Promise<{ county: string }>;
}

export async function generateStaticParams() {
  const { getAllCounties } = await import('@/lib/data');
  const counties = await getAllCounties();
  return counties.map((c) => ({ county: c.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { county: countySlug } = await params;
  const county = await getCountyBySlug(countySlug);
  if (!county) return {};
  const content = getCountyContent(countySlug, county.name);
  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: `/directory/${countySlug}`,
  });
}

export default async function DirectoryCountyPage({ params }: PageProps) {
  const { county: countySlug } = await params;
  const county = await getCountyBySlug(countySlug);
  if (!county) notFound();

  const [reps, stations] = await Promise.all([
    getRepsByCounty(county.name),
    getStationsByCounty(county.name),
  ]);
  const content = getCountyContent(countySlug, county.name);

  const canonicalPath = `/directory/${countySlug}`;
  const breadcrumbSchemaData = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Directory', url: '/directory' },
    { name: 'Counties', url: '/directory/counties' },
    { name: county.name, url: canonicalPath },
  ]);
  const placeSchemaData = placeSchema(county.name, canonicalPath);

  return (
    <>
      <JsonLd data={placeSchemaData} />
      <JsonLd data={breadcrumbSchemaData} />
      {reps.length > 0 && (
        <JsonLd
          data={legalServiceSchema({
            name: reps[0].name,
            slug: reps[0].slug,
            counties: [reps[0].county].filter(Boolean),
            accreditation: reps[0].accreditation,
            phone: reps[0].phone,
          })}
        />
      )}

      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Directory', href: '/directory' },
              { label: 'Counties', href: '/directory/counties' },
              { label: county.name },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">{content.h1}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">{content.intro}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <span className="flex items-center gap-2 text-white">
              <span className="text-2xl font-extrabold text-[var(--gold)]">{reps.length}</span>
              Representative{reps.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-2 text-white">
              <span className="text-2xl font-extrabold text-[var(--gold)]">{stations.length}</span>
              Station{stations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-6xl">
          <section>
            <h2 className="text-h2 text-[var(--navy)]">Representatives in {county.name}</h2>
            {reps.length === 0 ? (
              <p className="mt-3 text-[var(--muted)]">No representatives listed for this county yet.</p>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {reps.map((rep) => (
                  <DirectoryCard key={rep.id} rep={rep} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-12">
            <h2 className="text-h2 text-[var(--navy)]">Police stations in {county.name}</h2>
            {stations.length === 0 ? (
              <p className="mt-3 text-[var(--muted)]">No police stations listed for this county yet.</p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stations.map((station) => (
                  <StationCard key={station.id} station={station} />
                ))}
              </div>
            )}
          </section>

          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
            Listings are for professional reference. Police station representatives are accredited to attend under
            solicitor instruction where required — they are not a substitute for instructing a solicitor firm when that
            is necessary. Availability and coverage change; contact representatives directly to confirm.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/directory" className="font-medium text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
              ← Back to full directory
            </Link>
            <Link href="/directory/counties" className="font-medium text-[var(--muted)] no-underline hover:text-[var(--gold-hover)]">
              Browse all counties
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
