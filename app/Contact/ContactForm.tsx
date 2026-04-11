'use client';

import { useState } from 'react';
import Link from 'next/link';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [hp, setHp] = useState('');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [submissionRef, setSubmissionRef] = useState<string | null>(null);
  const [timingBaseline, setTimingBaseline] = useState(() => Date.now());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) return;
    setErrorDetail(null);
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          _hp: hp,
          _startedAt: timingBaseline,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        message?: string;
        error?: string;
      };
      if (res.ok && data.ok && data.id && data.id !== 'noop') {
        setSubmissionRef(data.id);
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimingBaseline(Date.now());
      } else if (res.ok && data.id === 'noop') {
        setStatus('idle');
      } else {
        setStatus('error');
        setErrorDetail(data.error || null);
      }
    } catch {
      setStatus('error');
      setErrorDetail(null);
    }
  }

  return (
    <>
      {status === 'success' && submissionRef && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-green-200 bg-green-50 p-5 text-green-900"
        >
          <p className="font-semibold text-green-950">Message received by the directory team — thank you</p>
          <p className="mt-2 text-sm leading-relaxed">
            The <strong>PoliceStationRepUK directory team</strong> has your enquiry and usually replies
            within <strong>24 hours</strong> (often sooner). Please note we are not the police and cannot
            help with criminal matters or custody queries.
          </p>
          <p className="mt-3 text-sm">
            <span className="font-medium">Reference:</span>{' '}
            <code className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-900">{submissionRef}</code>
          </p>
          <p className="mt-2 text-xs text-green-800">
            Keep this reference if you need to follow up with us. A copy has not been emailed to you automatically; check
            your inbox for our reply.
          </p>
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">We could not send your message</p>
          {errorDetail ? (
            <p className="mt-2 text-sm">{errorDetail}</p>
          ) : (
            <p className="mt-2 text-sm">Please try again or email us directly using the address above.</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 ${status === 'success' ? 'mt-6' : 'mt-8'}`}>
        <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)]">
            Your name
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="e.g. Jane Smith"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] placeholder:text-gray-400 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
            Your email
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            inputMode="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] placeholder:text-gray-400 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-[var(--foreground)]">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            placeholder="e.g. Directory listing query"
            value={formData.subject}
            onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] placeholder:text-gray-400 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-[var(--foreground)]">
            Message
          </label>
          <textarea
            id="message"
            required
            rows={5}
            placeholder="Please describe your directory-related enquiry here. We cannot help with police matters, active cases, or custody queries."
            value={formData.message}
            onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] placeholder:text-gray-400 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'sending'}
          aria-disabled={status === 'sending'}
          className="min-h-[44px] rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-[var(--navy)] shadow-sm transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <p className="text-xs text-[var(--muted)]">
          This form includes basic spam protection. If sending fails, please wait a few seconds and try again, or email us
          directly.
        </p>
      </form>

      <p className="mt-8 text-sm text-[var(--muted)]">
        <Link href="/" className="text-[var(--primary)] hover:underline">
          ← Back to home
        </Link>
      </p>
    </>
  );
}
