import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Firm outreach send-approve UI permanently removed. */
export default function SendApproveInterstitialPageRemoved() {
  notFound();
}
