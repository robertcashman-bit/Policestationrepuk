'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CUSTODYNOTE_TRIAL_HREF,
  EXIT_POPUP_TITLE,
  LEAD_MAGNET_TITLE,
} from '@/lib/custodynote-promo';

const SESSION_KEY = 'cn-exit-intent-shown';
const STORAGE_EMAIL_OK = 'cn-lead-dismissed';

export function CustodyNoteExitIntent() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [startedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    setMounted(true);
  }, []);

  const tryOpen = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return;
      if (localStorage.getItem(STORAGE_EMAIL_OK) === '1') return;
    } catch {
      return;
    }
    setOpen(true);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY > 0) return;
      tryOpen();
    };

    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, [mounted, tryOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) {
      setOpen(false);
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'exit-popup',
          leadMagnet: LEAD_MAGNET_TITLE,
          _hp: hp,
          _startedAt: startedAt,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus('done');
        try {
          localStorage.setItem(STORAGE_EMAIL_OK, '1');
        } catch {
          /* ignore */
        }
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (!mounted || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cn-exit-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-[var(--gold)]/40 bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold-hover)]">Before you go</p>
        <h2 id="cn-exit-title" className="mt-2 text-xl font-extrabold text-[var(--navy)] sm:text-2xl">
          {EXIT_POPUP_TITLE}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {LEAD_MAGNET_TITLE}. We will email a link to the resource. No spam — one follow-up max.
        </p>

        {status === 'done' ? (
          <p className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-900">
            Thank you — check your inbox shortly. You can also{' '}
            <a href={CUSTODYNOTE_TRIAL_HREF} className="font-semibold text-green-800 underline" target="_blank" rel="noopener noreferrer">
              start a free CustodyNote trial
            </a>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div aria-hidden className="absolute -left-[9999px]">
              <label htmlFor="cn-exit-company">Company</label>
              <input id="cn-exit-company" type="text" tabIndex={-1} value={hp} onChange={(e) => setHp(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cn-exit-email" className="block text-sm font-semibold text-slate-800">
                Work email
              </label>
              <input
                id="cn-exit-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border-2 border-slate-300 px-4 py-3 text-slate-900 shadow-sm focus:border-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/20"
                placeholder="you@firm.co.uk"
              />
            </div>
            {status === 'error' && (
              <p className="text-sm text-red-600">Something went wrong. Try again or use the contact page.</p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--gold)] px-6 py-3 text-sm font-bold text-[var(--navy)] disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending…' : 'Send me the template'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-slate-600 underline"
              >
                No thanks
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Prefer to browse first?{' '}
          <Link href="/CustodyNote" className="font-semibold text-[var(--navy)] underline">
            CustodyNote on this site
          </Link>
          . See our{' '}
          <Link href="/Privacy" className="underline">
            Privacy
          </Link>{' '}
          policy.
        </p>
      </div>
    </div>
  );
}
