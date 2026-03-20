import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRepBySlug } from '@/lib/data';
import { buildMetadata, legalServiceSchema, breadcrumbSchema, personSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const dynamic = 'force-static';
export const revalidate = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { getAllRepPathSlugs } = await import('@/lib/data');
  return getAllRepPathSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const rep = await getRepBySlug(slug);
  if (!rep) return {};
  return buildMetadata({
    title: `${rep.name} | Police Station Representative`,
    description: `Accredited police station representative ${rep.name}. Covers ${rep.county}. ${rep.accreditation}. Available for duty solicitor cover.`,
    path: `/rep/${rep.slug}`,
  });
}

const AVAIL_MAP: Record<string, { label: string; color: string }> = {
  'full-time': { label: '24/7 Available', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'part-time': { label: 'Part-time', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  weekends: { label: 'Weekends', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  nights: { label: 'Nights', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'on-call': { label: 'On-call', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default async function RepPage({ params }: PageProps) {
  const { slug } = await params;
  const rep = await getRepBySlug(slug);
  if (!rep) notFound();

  const availabilityLabel = rep.availability || 'Availability on request';
  const avail = AVAIL_MAP[rep.availability] ?? {
    label: availabilityLabel,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const legalService = legalServiceSchema({ name: rep.name, slug: rep.slug, counties: [rep.county].filter(Boolean), accreditation: rep.accreditation, phone: rep.phone });
  const person = personSchema({ name: rep.name, slug: rep.slug, phone: rep.phone, accreditation: rep.accreditation, counties: [rep.county].filter(Boolean) });
  const bc = breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Directory', url: '/directory' }, { name: rep.name, url: `/rep/${rep.slug}` }]);

  return (
    <>
      <JsonLd data={legalService} />
      <JsonLd data={person} />
      <JsonLd data={bc} />

      {/* Header banner */}
      <section className="bg-[var(--navy)] py-8 sm:py-12">
        <div className="page-container !py-0">
          <Breadcrumbs light items={[{ label: 'Home', href: '/' }, { label: 'Directory', href: '/directory' }, { label: rep.name }]} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${avail.color}`}>{avail.label}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              {(rep.accreditation || '').includes('Duty')
                ? 'Duty Solicitor Accredited'
                : (rep.accreditation || '').includes('Probationary')
                  ? 'Probationary Representative'
                  : 'Law Society Accredited'}
            </span>
          </div>
          <h1 className="mt-3 text-h1 text-white">{rep.name}</h1>
          <p className="mt-2 text-lg text-slate-300">
            {rep.county?.trim() ? rep.county : 'Coverage: see stations listed below'}
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Main content */}
            <div className="space-y-6">
              {/* About */}
              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">About</h2>
                <p className="mt-3 leading-relaxed text-[var(--muted)]">{rep.bio || rep.notes}</p>
              </section>

              {/* Stations covered */}
              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">Police stations covered</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rep.stations.map((s) => (
                    <span key={s} className="rounded-full bg-[var(--gold-pale)] px-3 py-1 text-sm font-medium text-[var(--navy)]">{s}</span>
                  ))}
                </div>
              </section>

              {/* Specialisms */}
              {rep.specialisms && rep.specialisms.length > 0 && (
                <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                  <h2 className="text-lg font-bold text-[var(--navy)]">Specialisms</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rep.specialisms.map((s) => (
                      <span key={s} className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-sm text-[var(--navy)]">{s}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* Languages */}
              {rep.languages && rep.languages.length > 1 && (
                <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                  <h2 className="text-lg font-bold text-[var(--navy)]">Languages</h2>
                  <p className="mt-3 text-[var(--muted)]">{rep.languages.join(', ')}</p>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact card */}
              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">Contact</h2>
                <div className="mt-4 space-y-3">
                  {rep.phone ? (
                    <a href={`tel:${rep.phone.replace(/\s/g, '')}`} className="btn-gold w-full">
                      📞 {rep.phone}
                    </a>
                  ) : null}
                  {rep.email ? (
                    <a href={`mailto:${rep.email}`} className="btn-outline w-full">
                      ✉️ Email
                    </a>
                  ) : null}
                  {rep.whatsappLink ? (
                    <a href={rep.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-outline w-full !border-emerald-300 !text-emerald-700 hover:!bg-emerald-50">
                      💬 WhatsApp
                    </a>
                  ) : null}
                  {!rep.phone && !rep.email && (
                    <p className="text-sm text-[var(--muted)]">Contact via directory search or WhatsApp group.</p>
                  )}
                </div>
              </section>

              {/* Quick info */}
              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">Details</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Availability</dt>
                    <dd className="mt-0.5 font-medium text-[var(--navy)]">{avail.label}</dd>
                  </div>
                  {rep.yearsExperience != null && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Experience</dt>
                      <dd className="mt-0.5 font-medium text-[var(--navy)]">{rep.yearsExperience} years</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Counties</dt>
                    <dd className="mt-0.5 font-medium text-[var(--navy)]">{rep.county}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Accreditation</dt>
                    <dd className="mt-0.5 font-medium text-[var(--navy)]">{rep.accreditation}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>

          <p className="mt-10">
            <Link href="/directory" className="font-medium text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
              ← Back to directory
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
