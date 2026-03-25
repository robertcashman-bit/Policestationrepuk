import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Escape Fee Calculator — Police Station Legal Aid Rates',
  description:
    'Calculate police station Legal Aid escape fees for accredited representatives. Compare national and London rates for own solicitor, duty solicitor, and representative attendance.',
  path: '/EscapeFeeCalculator',
});

export default function EscapeFeeCalcLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
