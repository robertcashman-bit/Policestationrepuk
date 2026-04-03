'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';

type Stage = 'email' | 'otp' | 'checking';

export function LoginForm() {
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const supabase = createClient();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/Account`,
        },
      });
      if (authError) {
        setError(authError.message);
      } else {
        setStage('otp');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const code = otp.trim();
    if (!code || code.length < 6) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    setStage('checking');
    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'email',
      });
      if (authError) {
        setError(authError.message);
        setStage('otp');
      } else {
        window.location.reload();
      }
    } catch {
      setError('Verification failed. Please try again.');
      setStage('otp');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-[var(--card-border)] bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-[var(--navy)]">Sign in to your account</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Enter the email address you registered with and we&rsquo;ll send you a one-time login code.
        </p>

        {stage === 'email' && (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[var(--navy)]">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn-gold w-full !text-sm disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Sign in with email'}
            </button>
          </form>
        )}

        {stage === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-medium text-emerald-800">
                Check your email for a login code.
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                We sent a 6-digit code to <strong>{email.trim()}</strong>. It may take a minute to arrive.
              </p>
            </div>
            <div>
              <label htmlFor="login-otp" className="block text-sm font-medium text-[var(--navy)]">
                Login code
              </label>
              <input
                id="login-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-center font-mono text-lg tracking-[0.3em] outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn-gold w-full !text-sm disabled:opacity-60"
            >
              {busy ? 'Verifying…' : 'Verify code'}
            </button>
            <button
              type="button"
              onClick={() => { setStage('email'); setOtp(''); setError(''); }}
              className="w-full text-center text-sm font-medium text-[var(--gold-link)] hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}

        {stage === 'checking' && (
          <div className="mt-6 flex items-center justify-center gap-2 py-8 text-sm text-[var(--muted)]">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing you in…
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--gold-pale)] p-6 text-center">
        <h3 className="font-bold text-[var(--navy)]">New to the directory?</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Create a free accredited rep profile so firms can find you.
        </p>
        <Link href="/register" className="btn-gold mt-3 inline-block !text-sm">
          Register free
        </Link>
      </div>
    </div>
  );
}
