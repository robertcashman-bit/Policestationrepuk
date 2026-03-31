interface AdvertisementLabelProps {
  variant?: 'light' | 'dark' | 'gold';
  label?: string;
  className?: string;
}

export function AdvertisementLabel({
  variant = 'light',
  label = 'Advertisement',
  className = '',
}: AdvertisementLabelProps) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest';

  const variantClass = {
    light: 'border border-slate-300 bg-white/90 text-slate-500',
    dark: 'border border-white/20 bg-white/10 text-white',
    gold: 'border border-[var(--gold)]/40 bg-[var(--gold-pale)] text-[var(--navy)]',
  }[variant];

  return (
    <span className={`${base} ${variantClass} ${className}`} aria-label={label}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden className="opacity-60">
        <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 11V5.5L8 10L10.5 5.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  );
}
