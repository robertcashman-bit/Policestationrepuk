import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  light,
  className,
}: {
  items: BreadcrumbItem[];
  light?: boolean;
  className?: string;
}) {
  const textClass = light ? '!text-[var(--breadcrumb-on-dark)]' : 'text-[var(--muted)]';
  const linkClass = light
    ? '!text-[var(--breadcrumb-link-on-dark)] hover:!text-[var(--breadcrumb-active-on-dark)]'
    : 'text-[var(--gold-link)] hover:text-[var(--gold)]';
  const activeClass = light ? '!text-[var(--breadcrumb-active-on-dark)]' : 'text-[var(--navy)]';

  return (
    <nav
      aria-label="Breadcrumb"
      className={`${light ? 'mb-2' : 'mb-4'} text-sm ${textClass} ${className ?? ''}`.trim()}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span className="px-1" aria-hidden>›</span>}
            {item.href ? (
              <Link href={item.href} className={`py-1 no-underline ${linkClass}`}>
                {item.label}
              </Link>
            ) : (
              <span className={`font-medium ${activeClass}`}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
