'use client';

import { useState } from 'react';
import Link from 'next/link';

export function AccountLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      {submitted && (
        <div
          role="status"
          className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-950"
        >
          <p className="font-semibold text-[var(--navy)]">Thanks — we’ve noted your sign-in request.</p>
          <p className="mt-2 text-[var(--muted)]">
            Self-service login for existing listings is still rolling out. To update your directory entry or get
            help right away, use{' '}
            <Link href="/Profile" className="font-medium text-[var(--gold-hover)] underline">
              My Profile
            </Link>{' '}
            or{' '}
            <Link href="/Contact" className="font-medium text-[var(--gold-hover)] underline">
              Contact
            </Link>
            .
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate={false}>
        <div>
          <label htmlFor="account-email" className="block text-sm font-medium text-[var(--foreground)]">
            Email
          </label>
          <input
            id="account-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSubmitted(false);
            }}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="account-password" className="block text-sm font-medium text-[var(--foreground)]">
            Password
          </label>
          <input
            id="account-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setSubmitted(false);
            }}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">At least 8 characters.</p>
        </div>
        <button type="submit" className="btn-gold w-full sm:w-auto !text-sm">
          Sign in
        </button>
      </form>
    </>
  );
}
