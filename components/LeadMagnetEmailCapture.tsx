'use client';

import { useState } from 'react';
import { LEAD_MAGNET_TITLE } from '@/lib/custodynote-promo';

export function LeadMagnetEmailCapture() {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [startedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'tools-section',
          leadMagnet: LEAD_MAGNET_TITLE,
          _hp: hp,
          _startedAt: startedAt,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && data.ok) {
        setStatus('done');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mt-10 rounded-2xl border-2 border-dashed border-[var(--gold)]/50 bg-white p-6 sm:p-8">
      <h3 className="text-lg font-extrabold text-[var(--navy)]">{LEAD_MAGNET_TITLE}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Enter your email — we will send a link to the template. No spam.
      </p>
      {status === 'done' ? (
        <p className="mt-4 text-sm font-medium text-green-700">Thanks — check your inbox shortly.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div aria-hidden className="absolute -left-[9999px]">
            <label htmlFor="lm-company">Company</label>
            <input id="lm-company" type="text" tabIndex={-1} value={hp} onChange={(e) => setHp(e.target.value)} />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="lm-email" className="sr-only">
              Email
            </label>
            <input
              id="lm-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
              className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-900 shadow-sm focus:border-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/20"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="min-h-[48px] shrink-0 rounded-xl bg-[var(--navy)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--navy-light)] disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : 'Get template'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">Could not send — try again in a moment.</p>
      )}
    </div>
  );
}
