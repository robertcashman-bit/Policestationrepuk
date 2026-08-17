import Link from 'next/link';
import { WHATSAPP_JOIN_URL, WHATSAPP_JOIN_PHONE } from '@/lib/site-navigation';

/** Soft Kent directory nudge — sidebar companion to directory listings. */
export function SidebarKentAgentPromo() {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Kent cover</p>
      <p className="mt-1 text-sm font-bold text-[var(--navy)]">Find Kent reps in the directory</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
        Free listings of accredited representatives covering Kent custody suites. Contact reps directly —
        no agency required to use this site.
      </p>
      <Link
        href="/directory/kent"
        className="mt-2 inline-block text-xs font-semibold text-[var(--navy)] underline"
      >
        Browse Kent directory →
      </Link>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/police-station-rep-kent"
          className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-lg bg-[var(--navy)] px-2 text-[11px] font-bold text-white no-underline"
        >
          Kent cover guide
        </Link>
        <Link
          href="/whatsapp/firms"
          className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-[var(--navy)] no-underline"
        >
          Firm WhatsApp
        </Link>
      </div>
    </div>
  );
}

export function SidebarWhatsAppPromo() {
  return (
    <div className="rounded-xl border border-emerald-800/20 bg-gradient-to-b from-emerald-950 to-[#0a1f1a] p-4 text-white">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Community</p>
      <p className="mt-1 text-sm font-bold">WhatsApp cover group</p>
      <p className="mt-1 text-xs leading-relaxed text-emerald-100/90">
        Accredited reps &amp; verified firms — text {WHATSAPP_JOIN_PHONE} to request to join.
      </p>
      <a
        href={WHATSAPP_JOIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-[36px] w-full items-center justify-center rounded-lg bg-[var(--gold)] px-2 text-[11px] font-bold text-[var(--navy)] no-underline"
      >
        Text to join
      </a>
    </div>
  );
}
