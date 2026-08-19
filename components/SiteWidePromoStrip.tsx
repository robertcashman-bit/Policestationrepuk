'use client';

import { usePathname } from 'next/navigation';
import { SisterToolsSlimBar } from '@/components/SisterToolsSlimBar';

/**
 * Global sister-tools strip. Homepage and /directory render their own slim bar
 * in-page; elsewhere show one slim bar (not a multi-card promo grid).
 */
export function SiteWidePromoStrip() {
  const pathname = usePathname();
  if (pathname === '/' || pathname === '/directory' || pathname?.startsWith('/directory/')) {
    return null;
  }

  return <SisterToolsSlimBar showDirectoryLink />;
}
