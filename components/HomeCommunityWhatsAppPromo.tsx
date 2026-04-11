import Link from 'next/link';
import { WHATSAPP_JOIN_URL, WHATSAPP_JOIN_PHONE, COMMUNITY_EMAIL } from '@/lib/site-navigation';

/**
 * Homepage promo — one WhatsApp group for accredited reps and verified criminal defence firms.
 * Full procedure: /WhatsApp
 */
export function HomeCommunityWhatsAppPromo() {
  return (
    <section
      className="border-y border-emerald-700/20 bg-gradient-to-b from-emerald-950 via-[#0a1f1a] to-emerald-950 py-10 sm:py-14"
      aria-labelledby="home-whatsapp-promo-heading"
    >
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/90">Community</p>
          <h2
            id="home-whatsapp-promo-heading"
            className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
          >
            Join the WhatsApp group
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100/85 sm:text-base">
            One group for <strong className="text-white">accredited reps</strong> and{' '}
            <strong className="text-white">criminal defence firms</strong> — cover requests, networking, and peer
            support. Free; members are verified before being added.
          </p>
        </div>

        <article className="mx-auto mt-10 max-w-2xl rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.06] p-6 shadow-lg backdrop-blur-sm sm:p-8">
          <h3 className="text-lg font-bold text-white">How to join (text {WHATSAPP_JOIN_PHONE})</h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-emerald-50/95">
            <li>
              Message <strong className="text-white">{WHATSAPP_JOIN_PHONE}</strong> (or use the button below). Say
              whether you are a <strong className="text-white">rep</strong> or a <strong className="text-white">firm</strong>, your name, and the right details: reps — accreditation and areas covered; firms — firm name and firm email.
            </li>
            <li>We verify reps (accreditation) and firms (e.g. SRA checks) where needed.</li>
            <li>Accept the WhatsApp invitation once approved — then you&apos;re in the same community thread.</li>
          </ol>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <a
              href={WHATSAPP_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-flex justify-center px-6 text-center text-sm no-underline"
            >
              Text to join on WhatsApp
            </a>
            <Link
              href="/WhatsApp"
              className="text-sm font-semibold text-emerald-300 underline decoration-emerald-500/50 underline-offset-2 hover:text-white"
            >
              Full joining procedure &rarr;
            </Link>
          </div>
          <p className="mt-6 text-center text-xs text-emerald-200/70">
            Prefer email?{' '}
            <a
              href={`mailto:${COMMUNITY_EMAIL}?subject=WhatsApp%20group%20request`}
              className="font-semibold text-emerald-200 underline hover:text-white"
            >
              {COMMUNITY_EMAIL}
            </a>
          </p>
        </article>
      </div>
    </section>
  );
}
