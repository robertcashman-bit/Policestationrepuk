import Link from 'next/link';
import { applyUnsubscribeToken } from '@/lib/firm-outreach/outreach/apply-unsubscribe';
import { buildMetadata } from '@/lib/seo';

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
  const result = await applyUnsubscribeToken(token);

  if (!result.ok) {
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

  return (
    <div className="page-container section-pad max-w-lg">
      <h1 className="text-h2 text-[var(--navy)]">You are unsubscribed</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        <strong>{result.email}</strong> will not receive further PoliceStationRepUK or Police
        Station Agent outreach emails.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-[var(--gold-link)]">
        Back to home
      </Link>
    </div>
  );
}
