'use client';

import dynamic from 'next/dynamic';

const CookieBanner = dynamic(
  () => import('@/components/CookieBanner').then((m) => ({ default: m.CookieBanner })),
  { ssr: false }
);
const HelpChatButton = dynamic(
  () => import('@/components/HelpChatButton').then((m) => ({ default: m.HelpChatButton })),
  { ssr: false }
);
const FloatingDirectoryActions = dynamic(
  () => import('@/components/FloatingDirectoryActions').then((m) => ({ default: m.FloatingDirectoryActions })),
  { ssr: false }
);

/** Loads cookie UI, help chat, and floating CTAs after hydration to trim main-thread work on first paint. */
export function DeferredGlobalWidgets() {
  return (
    <>
      <FloatingDirectoryActions />
      <HelpChatButton />
      <CookieBanner />
    </>
  );
}
