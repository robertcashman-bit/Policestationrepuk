import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FirmDirectory } from '@/components/FirmDirectory';
import { buildMetadata } from '@/lib/seo';
import { getAllLawFirms } from '@/lib/data';

export const metadata = buildMetadata({
  title: 'Criminal Defence Law Firms Directory',
  description:
    'Browse criminal defence firms with verified rep reviews — find firms that pay on time and treat reps well.',
  path: '/Firms',
});

const MAILTO_BASE = 'mailto:robertcashman@defencelegalservices.co.uk';

export default async function FirmsPage() {
  const firms = await getAllLawFirms();

  const stats = [
    { label: 'Active Firms', value: String(firms.length) },
    { label: 'Verified Reviews', value: '0' },
    { label: 'Highly Rated (4+)', value: '0' },
  ];

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Law Firms Directory' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Criminal Defence Law Firms Directory</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Browse criminal defence firms with verified rep reviews — find firms that pay on time and
            treat reps well.
          </p>
        </div>
      </section>

      <div className="page-container">
        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-center shadow-[var(--card-shadow)]"
            >
              <p className="text-3xl font-bold text-[var(--gold-hover)]">{stat.value}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Searchable directory */}
        <section className="mb-12">
          <FirmDirectory firms={firms} />
        </section>

        {/* Expand Your Reach */}
        <section className="mb-12">
          <h2 className="text-h2 mb-2 text-[var(--navy)]">Expand Your Reach</h2>
          <p className="mb-6 text-[var(--muted)]">
            Get your firm in front of hundreds of police station representatives actively looking for
            work across England &amp; Wales.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
              <p className="text-lg font-semibold text-[var(--navy)]">Free Listing</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Get your firm listed in our directory completely free of charge. Reach accredited reps
                actively looking for firms to work with.
              </p>
              <a
                href={`${MAILTO_BASE}?subject=Free%20Listing%20Request`}
                className="btn-gold mt-4 inline-block no-underline"
              >
                Request Free Listing
              </a>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
              <p className="text-lg font-semibold text-[var(--navy)]">Link Advert</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Premium link placement in our directory — your firm gets prominent positioning and
                increased visibility among working reps.
              </p>
              <a
                href={`${MAILTO_BASE}?subject=Link%20Advert%20Enquiry`}
                className="btn-outline mt-4 inline-block no-underline"
              >
                Enquire About Ads
              </a>
            </div>
          </div>
        </section>

        {/* Leave a Review */}
        <section className="mb-12">
          <h2 className="text-h2 mb-2 text-[var(--navy)]">Worked for a Firm? Leave a Review</h2>
          <p className="mb-4 text-[var(--muted)]">
            Help fellow reps by sharing your experience — did the firm pay on time? Were you treated
            professionally? Your anonymous review helps others make informed decisions.
          </p>
          <a
            href={`${MAILTO_BASE}?subject=Firm%20Review%20Submission`}
            className="btn-gold inline-block no-underline"
          >
            Submit a Review
          </a>
        </section>
      </div>
    </>
  );
}
