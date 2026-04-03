'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  accreditation: string;
  availability: string;
  postcode: string;
  stations_covered: string;
  notes: string;
  website_url: string;
  whatsapp_link: string;
  dscc_pin: string;
  holiday_availability: string;
  languages: string;
  specialisms: string;
  years_experience: string;
}

const EMPTY_PROFILE: ProfileData = {
  name: '',
  email: '',
  phone: '',
  accreditation: '',
  availability: '',
  postcode: '',
  stations_covered: '',
  notes: '',
  website_url: '',
  whatsapp_link: '',
  dscc_pin: '',
  holiday_availability: '',
  languages: '',
  specialisms: '',
  years_experience: '',
};

type Status = 'loading' | 'ready' | 'not-found' | 'saving' | 'saved' | 'error';

export function AccountDashboard({ userEmail }: { userEmail: string }) {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [original, setOriginal] = useState<ProfileData>(EMPTY_PROFILE);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [repSlug, setRepSlug] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const supabase = createClient();

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/account/profile');
      if (res.status === 404) {
        setStatus('not-found');
        return;
      }
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      const p: ProfileData = {
        name: data.name ?? '',
        email: data.email ?? userEmail,
        phone: data.phone ?? '',
        accreditation: data.accreditation ?? '',
        availability: data.availability ?? '',
        postcode: data.postcode ?? '',
        stations_covered: Array.isArray(data.stations_covered)
          ? data.stations_covered.join(', ')
          : data.stations_covered ?? '',
        notes: data.notes ?? '',
        website_url: data.website_url ?? '',
        whatsapp_link: data.whatsapp_link ?? '',
        dscc_pin: data.dscc_pin ?? '',
        holiday_availability: Array.isArray(data.holiday_availability)
          ? data.holiday_availability.join(', ')
          : data.holiday_availability ?? '',
        languages: Array.isArray(data.languages)
          ? data.languages.join(', ')
          : data.languages ?? '',
        specialisms: Array.isArray(data.specialisms)
          ? data.specialisms.join(', ')
          : data.specialisms ?? '',
        years_experience: data.years_experience != null ? String(data.years_experience) : '',
      };
      setProfile(p);
      setOriginal(p);
      setRepSlug(data.slug ?? '');
      setUpdatedAt(data.updated_at ?? null);
      setStatus('ready');
    } catch {
      setStatus('error');
      setErrorMsg('Could not load your profile. Please try again.');
    }
  }, [userEmail]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  function set(field: keyof ProfileData, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(original);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');
    try {
      const payload: Record<string, unknown> = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        accreditation: profile.accreditation.trim(),
        availability: profile.availability.trim(),
        postcode: profile.postcode.trim(),
        stations_covered: profile.stations_covered
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        notes: profile.notes.trim(),
        website_url: profile.website_url.trim(),
        whatsapp_link: profile.whatsapp_link.trim(),
        dscc_pin: profile.dscc_pin.trim(),
        holiday_availability: profile.holiday_availability
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        languages: profile.languages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        specialisms: profile.specialisms
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        years_experience: profile.years_experience.trim()
          ? parseInt(profile.years_experience.trim(), 10) || null
          : null,
      };

      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Save failed');
      }

      const saved = await res.json();
      setUpdatedAt(saved.updated_at ?? new Date().toISOString());
      setOriginal(profile);
      setStatus('saved');
      setTimeout(() => setStatus('ready'), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
      setStatus('error');
      setTimeout(() => setStatus('ready'), 4000);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--muted)]">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading your profile…
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
          <h2 className="text-lg font-bold text-[var(--navy)]">Listing not found</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            We couldn&rsquo;t find a directory listing for <strong>{userEmail}</strong>.
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            If you&rsquo;re already listed under a different email, contact us. Otherwise, register for a free profile.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-gold !text-sm">Register free</Link>
            <Link href="/Contact" className="btn-outline !text-sm">Contact us</Link>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 text-sm font-medium text-[var(--gold-link)] hover:underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[var(--navy)]">
            Welcome back, {profile.name || userEmail}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Signed in as {userEmail}
            {repSlug && (
              <>
                {' · '}
                <Link href={`/rep/${repSlug}`} className="font-medium text-[var(--gold-link)] hover:underline">
                  View public profile
                </Link>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-red-300 hover:text-red-600"
        >
          Sign out
        </button>
      </div>

      {updatedAt && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Last updated: {new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      <form onSubmit={handleSave} className="mt-6 space-y-8">
        {/* Identity */}
        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Identity</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={profile.name} onChange={(v) => set('name', v)} required />
            <Field label="Accreditation" value={profile.accreditation} onChange={(v) => set('accreditation', v)} placeholder="e.g. Law Society Accredited" />
          </div>
        </fieldset>

        {/* Contact */}
        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Contact</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Phone" type="tel" value={profile.phone} onChange={(v) => set('phone', v)} />
            <Field label="Email" type="email" value={profile.email} disabled note="Contact us to change your email" />
            <Field label="Website" type="url" value={profile.website_url} onChange={(v) => set('website_url', v)} placeholder="https://…" />
            <Field label="WhatsApp link" type="url" value={profile.whatsapp_link} onChange={(v) => set('whatsapp_link', v)} placeholder="https://wa.me/…" />
          </div>
        </fieldset>

        {/* Coverage */}
        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Coverage &amp; availability</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Availability" value={profile.availability} onChange={(v) => set('availability', v)} placeholder="e.g. 24/7, Weekends only" />
            <Field label="Postcode" value={profile.postcode} onChange={(v) => set('postcode', v)} placeholder="e.g. SW1A 1AA" />
            <div className="sm:col-span-2">
              <Field
                label="Stations covered"
                value={profile.stations_covered}
                onChange={(v) => set('stations_covered', v)}
                placeholder="Comma-separated station names"
                note="Separate with commas"
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Holiday availability"
                value={profile.holiday_availability}
                onChange={(v) => set('holiday_availability', v)}
                placeholder="e.g. Christmas, Bank holidays"
                note="Comma-separated"
              />
            </div>
          </div>
        </fieldset>

        {/* Profile */}
        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Profile</legend>
          <div className="mt-3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--navy)]">Notes / bio</label>
              <textarea
                value={profile.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
                placeholder="Tell firms about your experience and areas of expertise…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Languages" value={profile.languages} onChange={(v) => set('languages', v)} placeholder="e.g. English, Welsh" note="Comma-separated" />
              <Field label="Specialisms" value={profile.specialisms} onChange={(v) => set('specialisms', v)} placeholder="e.g. Fraud, Drug offences" note="Comma-separated" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Years of experience" type="number" value={profile.years_experience} onChange={(v) => set('years_experience', v)} placeholder="e.g. 5" />
              <Field label="DSCC PIN" value={profile.dscc_pin} onChange={(v) => set('dscc_pin', v)} placeholder="Your DSCC PIN" />
            </div>
          </div>
        </fieldset>

        {/* Status bar */}
        {status === 'saved' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Profile saved successfully.
          </div>
        )}
        {status === 'error' && errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-[var(--border)] pt-6">
          <button
            type="submit"
            disabled={!hasChanges || status === 'saving'}
            className="btn-gold !text-sm disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
          {hasChanges && (
            <span className="text-xs text-amber-600">You have unsaved changes</span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  note,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--navy)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 disabled:bg-slate-50 disabled:text-[var(--muted)]"
      />
      {note && <p className="mt-1 text-xs text-[var(--muted)]">{note}</p>}
    </div>
  );
}
