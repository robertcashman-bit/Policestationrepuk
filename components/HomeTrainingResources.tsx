import Link from 'next/link';

const RESOURCE_CARDS = [
  {
    icon: '📚',
    title: 'Training Guides',
    description: '45+ professional development articles covering interview techniques, client management, and more.',
    href: '/Premium',
    cta: 'Browse Guides',
  },
  {
    icon: '💷',
    title: 'Escape Fee Calculator',
    description: 'Calculate whether your attendance qualifies for escape fees under the harmonised structure.',
    href: '/EscapeFeeCalculator',
    cta: 'Use Calculator',
  },
  {
    icon: '📋',
    title: 'Forms Library',
    description: 'Download CRM1, CRM2, CRM4, and other essential criminal legal aid forms.',
    href: '/FormsLibrary',
    cta: 'View Forms',
  },
  {
    icon: '⚖️',
    title: 'PACE Codes',
    description: 'Quick-reference guide to PACE Codes A–H for custody attendance and interview.',
    href: '/PACE',
    cta: 'View Codes',
  },
];

export function HomeTrainingResources() {
  return (
    <section className="bg-white py-14 sm:py-16">
      <div className="page-container">
        <div className="text-center">
          <h3 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">
            Training Guides &amp; Resources
          </h3>
          <p className="mt-3 text-[var(--muted)]">
            Free tools and guides for police station representatives.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCE_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)] no-underline transition-all hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--gold)]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--navy)] text-xl">
                {card.icon}
              </span>
              <h4 className="mt-4 text-base font-bold text-[var(--navy)]">{card.title}</h4>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{card.description}</p>
              <span className="mt-4 text-sm font-semibold text-[var(--gold-hover)] transition-colors group-hover:text-[var(--gold)]">
                {card.cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
