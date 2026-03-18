import type { ReactNode } from 'react';

export interface PageSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({ title, children, className = '' }: PageSectionProps) {
  return (
    <section className={`py-12 sm:py-16 ${className}`}>
      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        {title && (
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}
