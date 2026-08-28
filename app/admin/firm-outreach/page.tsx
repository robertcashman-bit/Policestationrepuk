import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Firm outreach email admin UI permanently removed. */
export default function FirmOutreachAdminPageRemoved() {
  notFound();
}
