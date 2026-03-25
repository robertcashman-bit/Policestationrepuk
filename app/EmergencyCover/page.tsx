import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmergencyCoverForm } from './EmergencyCoverForm';

export const metadata = buildMetadata({
  title: 'Emergency Police Station Cover — Request a Rep Now',
  description:
    'Need urgent police station cover? Submit an emergency request and we will connect you with an available accredited representative. 24/7 coverage across England and Wales.',
  path: '/EmergencyCover',
});

export default function EmergencyCoverPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Emergency Cover' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Emergency Police Station Cover</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Need a rep at short notice? Complete this form and we&apos;ll circulate your request to
            available representatives immediately.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-2xl">
          <EmergencyCoverForm />

          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--gold-pale)] bg-[var(--gold-pale)] p-6">
            <h2 className="text-lg font-bold text-[var(--navy)]">Prefer to call or text?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              For immediate assistance, call{' '}
              <a href="tel:07535494446" className="font-semibold text-[var(--navy)] hover:underline">
                07535 494446
              </a>{' '}
              or send a WhatsApp message to the same number. You can also use the{' '}
              <a
                href="https://wa.me/447535494446?text=URGENT%20COVER%20REQUEST%20-%20I%20need%20a%20police%20station%20rep"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] hover:underline"
              >
                WhatsApp link
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
