import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { HelpChatButton } from '@/components/HelpChatButton';
import { FloatingDirectoryActions } from '@/components/FloatingDirectoryActions';
import './globals.css';
import { SITE_URL } from '@/lib/seo-layer/config';

/** Set in Vercel / `.env` when verifying in Google Search Console (omit to skip meta tag). */
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2f6cab',
};

export const metadata: Metadata = {
  title: {
    default: 'Home | PoliceStationRepUK — Find Accredited Police Station Reps',
    /** Pages set full titles (most already include the brand); avoid double “| PoliceStationRepUK”. */
    template: '%s',
  },
  description:
    'Free directory of accredited police station representatives across England & Wales. Find reps by county, station, or name. 100% free for solicitors and reps. No fees ever.',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  openGraph: {
    siteName: 'PoliceStationRepUK',
    locale: 'en_GB',
    type: 'website',
    title: 'PoliceStationRepUK — Free Police Station Rep Directory UK',
    description:
      'The UK\'s free directory connecting criminal defence firms with accredited police station representatives across England & Wales.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PoliceStationRepUK — Free Police Station Rep Directory',
    description:
      'Find accredited police station reps across England & Wales. 100% free for solicitors and reps.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  ...(GOOGLE_SITE_VERIFICATION
    ? { other: { 'google-site-verification': GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="site-shell-main flex-1 w-full min-w-0">{children}</main>
        <Footer />
        <FloatingDirectoryActions />
        <HelpChatButton />
        <CookieBanner />
      </body>
    </html>
  );
}
