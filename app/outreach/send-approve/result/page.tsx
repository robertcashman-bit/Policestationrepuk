import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Firm outreach send-approve result UI permanently removed. */
export default function SendApproveResultPageRemoved() {
  notFound();
}
