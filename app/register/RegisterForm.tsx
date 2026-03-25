'use client';

import { useState } from 'react';
import Link from 'next/link';

export function RegisterForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accreditation: '',
    counties: '',
    stations: '',
    availability: 'full-time',
    message: '',
  });
  const [hp, setHp] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          _hp: hp,
          counties: formData.counties ? formData.counties.split(/[\s,]+/).filter(Boolean) : [],
          stations: formData.stations ? formData.stations.split(/[\s,]+/).filter(Boolean) : [],
        }),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          accreditation: '',
          counties: '',
          stations: '',
          availability: 'full-time',
          message: '',
        });
      } else setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      {status === 'success' && (
        <div role="alert" className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          Thank you. Your registration request has been received. We will be in touch.
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Something went wrong. Please try again or contact us.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
          <label htmlFor="reg-website">Website</label>
          <input id="reg-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)]">
            Full name *
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
            Email *
          </label>
          <input
            id="email"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[var(--foreground)]">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          />
        </div>
        <div>
          <label htmlFor="accreditation" className="block text-sm font-medium text-[var(--foreground)]">
            Accreditation (e.g. Law Society, Duty Solicitor)
          </label>
          <input
            id="accreditation"
            type="text"
            value={formData.accreditation}
            onChange={(e) => setFormData((p) => ({ ...p, accreditation: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          />
        </div>
        <div>
          <label htmlFor="counties" className="block text-sm font-medium text-[var(--foreground)]">
            Counties covered (comma-separated)
          </label>
          <input
            id="counties"
            type="text"
            placeholder="e.g. Kent, London, Essex"
            value={formData.counties}
            onChange={(e) => setFormData((p) => ({ ...p, counties: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          />
        </div>
        <div>
          <label htmlFor="stations" className="block text-sm font-medium text-[var(--foreground)]">
            Stations covered (comma-separated)
          </label>
          <input
            id="stations"
            type="text"
            placeholder="e.g. Maidstone, Canterbury"
            value={formData.stations}
            onChange={(e) => setFormData((p) => ({ ...p, stations: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          />
        </div>
        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-[var(--foreground)]">
            Availability
          </label>
          <select
            id="availability"
            value={formData.availability}
            onChange={(e) => setFormData((p) => ({ ...p, availability: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="weekends">Weekends</option>
            <option value="nights">Nights</option>
            <option value="on-call">On-call</option>
          </select>
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-[var(--foreground)]">
            Additional details
          </label>
          <textarea
            id="message"
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="min-h-[44px] rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-[var(--navy)] shadow-sm hover:bg-[var(--accent-hover)] disabled:opacity-70"
        >
          {status === 'sending' ? 'Submitting…' : 'Submit registration'}
        </button>
      </form>

      <p className="mt-8 text-sm text-[var(--muted)]">
        <Link href="/" className="font-medium text-[var(--primary)] hover:underline">
          ← Back to homepage
        </Link>
      </p>
    </>
  );
}
