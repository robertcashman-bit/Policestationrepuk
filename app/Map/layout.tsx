import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Interactive Police Station Map | PoliceStationRepUK',
  description:
    'Explore an interactive map of UK police stations and custody suites. Locate stations by region, view contact details, and find accredited representatives covering each area.',
  path: '/Map',
});

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
