import type { ReactNode } from 'react';

export interface ContentBlockProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function ContentBlock({ title, children, className = '' }: ContentBlockProps) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-white p-6 sm:p-8 ${className}`}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h3>
      )}
      <div className="prose prose-sm max-w-none text-[var(--foreground)] [&_p]:text-[var(--muted)] [&_p]:leading-relaxed">
        {children}
      </div>
    </div>
  );
}
