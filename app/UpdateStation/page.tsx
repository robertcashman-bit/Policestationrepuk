import { getAllStations } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StationUpdateForm } from '@/components/StationUpdateForm';
import type { StationStub } from '@/components/StationUpdateForm';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Suggest a Station Update — Help Keep Data Accurate | PoliceStationRepUK',
  description:
    'Spotted an incorrect address or phone number for a UK police station? Submit a correction and help us keep our directory accurate. All suggestions are reviewed before publishing.',
  path: '/UpdateStation',
});

export const dynamic = 'force-static';

export default async function UpdateStationPage() {
  const stations = await getAllStations();

  const stubs: StationStub[] = stations.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address || '',
    postcode: s.postcode || '',
    phone: s.phone || '',
    custodyPhone: s.custodyPhone || '',
    nonEmergencyPhone: s.nonEmergencyPhone || '',
  }));

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Station Directory', href: '/StationsDirectory' },
              { label: 'Suggest an Update' },
            ]}
          />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Suggest a Station Update
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Help keep UK police station data accurate. If you know an address or phone number has
            changed, submit a correction below. We review every suggestion before publishing.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="text-sm leading-relaxed text-amber-800">
              <p className="font-semibold">How this works</p>
              <p className="mt-1">
                Your suggestion will be reviewed by an admin before it goes live. This protects the
                directory from inaccurate data. Your name and email are kept private.
              </p>
            </div>
          </div>
        </div>

        <StationUpdateForm stations={stubs} />
      </div>
    </>
  );
}
