'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ENGLISH_COUNTIES, validateEnglishCountySelections } from '@/lib/english-counties';

export function RegisterForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [selectedCounties, setSelectedCounties] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accreditation: '',
    stations: '',
    coverage_areas: '',
    availability: 'full-time',
    message: '',
  });
  const [hp, setHp] = useState('');

  function toggleCounty(name: string) {
    setSelectedCounties((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) return;
    setErrorDetail(null);
    const countyValidation = validateEnglishCountySelections([...selectedCounties]);
    if (!countyValidation.ok) {
      setStatus('error');
      setErrorDetail(countyValidation.error);
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          _hp: hp,
          counties: countyValidation.canonical,
          stations: formData.stations ? formData.stations.split(',').map((s) => s.trim()).filter(Boolean) : [],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };

      if (res.ok && (data.ok || data.id === 'noop')) {
        setStatus('success');
        setSelectedCounties(new Set());
        setFormData({
          name: '',
          email: '',
          phone: '',
          accreditation: '',
          stations: '',
          coverage_areas: '',
          availability: 'full-time',
          message: '',
        });
        return;
      }

      setStatus('error');
      setErrorDetail(data.error || null);
    } catch {
      setStatus('error');
      setErrorDetail(null);
    }
  }

  return (
    <>
      {status === 'success' && (
        <div role="alert" className="rounded-lg border border-green-200 bg-green-50 p-5 text-green-800">
          <p className="font-semibold">Registration received — thank you</p>
          <p className="mt-2 text-sm leading-relaxed">
            We have sent a <strong>confirmation email</strong> to the address you provided. Our team
            will review your details and your profile should be live within <strong>24 hours</strong>{' '}
            (often sooner). If you don&rsquo;t see the email, please check your spam folder.
          </p>
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>Something went wrong. Please try again or contact us.</p>
          {errorDetail && <p className="mt-2 text-sm">{errorDetail}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: 0, width: 0, overflow: 'hidden', opacity: 0 }}>
          <label htmlFor="reg-website">Website</label>
          <input id="reg-website" name="website" type="text" tabIndex={-1} autoComplete="nope" value={hp} onChange={(e) => setHp(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
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
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="accreditation" className="block text-sm font-medium text-[var(--foreground)]">
              Accreditation
            </label>
            <input
              id="accreditation"
              type="text"
              placeholder="e.g. PSRAS, Duty Solicitor"
              value={formData.accreditation}
              onChange={(e) => setFormData((p) => ({ ...p, accreditation: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>
        </div>
        <fieldset>
          <legend className="block text-sm font-medium text-[var(--foreground)]">
            English counties you cover <span className="text-red-600">*</span>
          </legend>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Select every ceremonial county you cover. For London boroughs, towns, or other locality detail, use the
            field below.
          </p>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-[var(--border)] bg-white p-3 sm:max-h-72">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ENGLISH_COUNTIES.map((c) => (
                <label key={c} className="flex cursor-pointer items-start gap-2 text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={selectedCounties.has(c)}
                    onChange={() => toggleCounty(c)}
                    className="mt-0.5 shrink-0 rounded border-[var(--border)]"
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>
        <div>
          <label htmlFor="coverage_areas" className="block text-sm font-medium text-[var(--foreground)]">
            Towns, boroughs &amp; wider coverage (optional)
          </label>
          <textarea
            id="coverage_areas"
            rows={3}
            value={formData.coverage_areas}
            onChange={(e) => setFormData((p) => ({ ...p, coverage_areas: e.target.value }))}
            placeholder="e.g. Specific London boroughs, travel radius, cross-border cover…"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="stations" className="block text-sm font-medium text-[var(--foreground)]">
            Stations covered
          </label>
          <input
            id="stations"
            type="text"
            placeholder="e.g. Maidstone Police Station, Canterbury Police Station"
            value={formData.stations}
            onChange={(e) => setFormData((p) => ({ ...p, stations: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">Add the custody suites or stations you can realistically attend.</p>
        </div>
        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-[var(--foreground)]">
            Availability
          </label>
          <select
            id="availability"
            value={formData.availability}
            onChange={(e) => setFormData((p) => ({ ...p, availability: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
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
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
            placeholder="Add notes that help firms instruct you quickly, such as travel radius, overnight work, language skills, or specialist experience."
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
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
