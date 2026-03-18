'use client';

import { useState } from 'react';
import Link from 'next/link';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      {status === 'success' && (
        <div role="alert" className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          Thank you. Your message has been sent.
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Something went wrong. Please try again or email us directly.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)]">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
            Email
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
          <label htmlFor="subject" className="block text-sm font-medium text-[var(--foreground)]">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
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
            value={formData.message}
            onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'sending'}
          aria-disabled={status === 'sending'}
          className="min-h-[44px] rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
      </form>

      <p className="mt-8 text-sm text-[var(--muted)]">
        <Link href="/" className="text-[var(--primary)] hover:underline">
          ← Back to home
        </Link>
      </p>
    </>
  );
}
