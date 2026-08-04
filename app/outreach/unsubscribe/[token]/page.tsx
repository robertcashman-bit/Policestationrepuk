import Link from 'next/link';
import {
  addSuppression,
  getProspectByEmail,
  saveProspect,
} from '@/lib/firm-outreach/storage';
import { verifyUnsubscribeToken } from '@/lib/firm-outreach/outreach/unsubscribe-token';
import { buildMetadata } from '@/lib/seo';
import { OUTREACH_CAMPAIGN_IDS } from '@/lib/firm-outreach/site-config';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Unsubscribe — firm outreach',
  description: 'Opt out of PoliceStationRepUK and Police Station Agent firm outreach emails.',
  path: '/outreach/unsubscribe',
  noIndex: true,
});

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyUnsubscribeToken(decodeURIComponent(token));

  if (!payload) {
    return (
      <div className="page-container section-pad max-w-lg">
        <h1 className="text-h2 text-[var(--navy)]">Invalid or expired link</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          This unsubscribe link is not valid. Email{' '}
          <a href="mailto:robertcashman@defencelegalservices.co.uk" className="underline">
            robertcashman@defencelegalservices.co.uk
          </a>{' '}
          to opt out manually.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-[var(--gold-link)]">
          Back to home
        </Link>
      </div>
    );
  }

  const email = payload.email.trim().toLowerCase();
  await addSuppression(email, 'unsubscribe');

  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    const prospect = await getProspectByEmail(email, campaignId);
    if (!prospect) continue;
    if (prospect.status === 'unsubscribed') continue;
    prospect.status = 'unsubscribed';
    prospect.updatedAt = new Date().toISOString();
    await saveProspect(prospect);
  }

  return (
    <div className="page-container section-pad max-w-lg">
      <h1 className="text-h2 text-[var(--navy)]">You are unsubscribed</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        <strong>{payload.email}</strong> will not receive further PoliceStationRepUK or Police
        Station Agent outreach emails.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-[var(--gold-link)]">
        Back to home
      </Link>
    </div>
  );
}
