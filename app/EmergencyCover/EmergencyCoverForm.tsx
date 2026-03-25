'use client';

import { useState, type FormEvent } from 'react';

export function EmergencyCoverForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');

    const data = Object.fromEntries(new FormData(e.currentTarget));

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.firmName,
          email: data.email,
          subject: `EMERGENCY COVER — ${data.station || 'Station not specified'}`,
          message: [
            `Station / Area: ${data.station}`,
            `Date / Time needed: ${data.dateTime}`,
            `Offence type: ${data.offenceType}`,
            `Contact number: ${data.phone}`,
            data.notes ? `Notes: ${data.notes}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        }),
      });

      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-[var(--radius-lg)] border-2 border-emerald-300 bg-emerald-50 p-8 text-center">
        <p className="text-lg font-bold text-emerald-800">Request submitted</p>
        <p className="mt-2 text-sm text-emerald-700">
          Your emergency cover request has been circulated. A representative or our team will contact
          you shortly. For faster response, also call or WhatsApp{' '}
          <a href="tel:07535494446" className="font-semibold underline">
            07535 494446
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="ec-firm" className="block text-sm font-semibold text-[var(--navy)]">
          Firm / Solicitor Name <span className="text-red-500">*</span>
        </label>
        <input
          id="ec-firm"
          name="firmName"
          required
          className="mt-1.5 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30"
          placeholder="e.g. Smith & Jones Solicitors"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ec-email" className="block text-sm font-semibold text-[var(--navy)]">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="ec-email"
            name="email"
            type="email"
            required
            className="mt-1.5 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30"
          />
        </div>
        <div>
          <label htmlFor="ec-phone" className="block text-sm font-semibold text-[var(--navy)]">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="ec-phone"
            name="phone"
            type="tel"
            required
            className="mt-1.5 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ec-station" className="block text-sm font-semibold text-[var(--navy)]">
          Police Station / Custody Suite <span className="text-red-500">*</span>
        </label>
        <input
          id="ec-station"
          name="station"
          required
          className="mt-1.5 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30"
          placeholder="e.g. Maidstone, Brixton, Leeds Elland Road"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ec-datetime" className="block text-sm font-semibold text-[var(--navy)]">
            When is cover needed? <span className="text-red-500">*</span>
          </label>
          <input
            id="ec-datetime"
            name="dateTime"
            required
            className="mt-1.5 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30"
            placeholder="e.g. Now / Today 6pm / Tomorrow morning"
          />
        </div>
        <div>
          <label htmlFor="ec-offence" className="block text-sm font-semibold text-[var(--navy)]">
            Offence type (if known)
          </label>
          <input
            id="ec-offence"
            name="offenceType"
            className="mt-1.5 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30"
            placeholder="e.g. Assault, Drug supply, Fraud"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ec-notes" className="block text-sm font-semibold text-[var(--navy)]">
          Additional notes
        </label>
        <textarea
          id="ec-notes"
          name="notes"
          rows={3}
          className="mt-1.5 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30"
          placeholder="Any special requirements, interpreter needed, etc."
        />
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-[var(--radius-lg)] bg-red-600 px-6 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {status === 'sending' ? 'Submitting…' : 'Submit Emergency Cover Request'}
      </button>

      {status === 'error' && (
        <p className="text-center text-sm font-medium text-red-600">
          Something went wrong. Please try again or call 07535 494446 directly.
        </p>
      )}
    </form>
  );
}
