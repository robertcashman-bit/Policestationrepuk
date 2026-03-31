'use client';

import Link from 'next/link';
import type { County } from '@/lib/types';

interface QuickActionsProps {
  counties: County[];
  onQuick: (entries: [string, string][]) => void;
}

const QUICK_COUNTIES = ['Kent', 'London', 'Essex', 'Greater Manchester', 'West Midlands'];

export function QuickActions({ counties, onQuick }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onQuick([['urgent', '1'], ['sort', 'smart']])}
        className="rounded-full border-2 border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-950 transition hover:bg-rose-100"
      >
        Urgent cover
      </button>
      <button
        type="button"
        onClick={() => onQuick([['availability', '24-7'], ['sort', 'smart']])}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] shadow-sm hover:border-[var(--gold)]"
      >
        24/7 reps
      </button>
      <Link
        href="/directory/counties"
        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline shadow-sm hover:border-[var(--gold)]"
      >
        By county
      </Link>
      <Link
        href="/Forces"
        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline shadow-sm hover:border-[var(--gold)]"
      >
        By force
      </Link>

      <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" aria-hidden />

      {QUICK_COUNTIES.filter((n) => counties.some((c) => c.name === n)).map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onQuick([['county', name], ['availability', 'evenings-nights'], ['sort', 'smart']])}
          className="rounded-full bg-[var(--navy)]/8 px-3 py-1.5 text-xs font-semibold text-[var(--navy)] hover:bg-[var(--navy)]/15"
        >
          {name}
        </button>
      ))}
    </div>
  );
}
