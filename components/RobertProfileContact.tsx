'use client';

import { useCallback, useState } from 'react';
import { phoneToTelHref } from '@/lib/phone';

type RevealPayload = {
  display: string;
  tel: string;
  sms: string;
};

/**
 * Robert Cashman profile contact block:
 * - Office landline is visible (passed in — never the mobile).
 * - Direct mobile is fetched client-side only after an explicit solicitor/agency confirm.
 */
export function RobertProfileContact({ officePhone }: { officePhone: string }) {
  const [step, setStep] = useState<'closed' | 'confirm' | 'loading' | 'shown' | 'error'>('closed');
  const [confirmed, setConfirmed] = useState(false);
  const [mobile, setMobile] = useState<RevealPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const officeTel = officePhone ? phoneToTelHref(officePhone) : '';

  const reveal = useCallback(async () => {
    if (!confirmed) return;
    setStep('loading');
    setError(null);
    try {
      const res = await fetch('/api/rep/robert-cashman/direct-mobile', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(
          res.status === 429 ? 'Too many requests. Try again shortly.' : 'Could not load number.',
        );
      }
      const data = (await res.json()) as RevealPayload;
      if (!data?.display || !data?.tel) throw new Error('Could not load number.');
      setMobile(data);
      setStep('shown');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load number.');
      setStep('error');
    }
  }, [confirmed]);

  return (
    <div className="space-y-4">
      {officePhone ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Office / messages (answering service)
          </p>
          <a href={officeTel} className="btn-gold mt-2 w-full text-center font-bold">
            Call {officePhone}
          </a>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        {step === 'closed' ? (
          <button
            type="button"
            className="btn-outline w-full text-center text-sm font-semibold"
            onClick={() => setStep('confirm')}
          >
            For solicitors &amp; agencies: show direct mobile
          </button>
        ) : null}

        {step === 'confirm' || step === 'loading' || step === 'error' ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--navy)]">
              Direct mobile is for solicitors and agencies instructing cover only.
            </p>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>I am instructing on behalf of a solicitors&apos; firm or agency</span>
            </label>
            <button
              type="button"
              className="btn-gold w-full text-center text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!confirmed || step === 'loading'}
              onClick={() => void reveal()}
            >
              {step === 'loading' ? 'Loading…' : 'Reveal direct mobile'}
            </button>
            {error ? <p className="text-xs text-red-700">{error}</p> : null}
            <button
              type="button"
              className="w-full text-center text-xs font-medium text-slate-500 underline"
              onClick={() => {
                setStep('closed');
                setConfirmed(false);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        ) : null}

        {step === 'shown' && mobile ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Urgent instructions / texts
            </p>
            <p className="mt-1 text-lg font-bold text-[var(--navy)]">{mobile.display}</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <a href={mobile.tel} className="btn-gold flex-1 text-center text-sm font-bold">
                Call
              </a>
              <a href={mobile.sms} className="btn-outline flex-1 text-center text-sm font-semibold">
                SMS
              </a>
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-xs leading-relaxed text-slate-600">
        This is not the police station. If you&apos;re a member of the public trying to reach someone
        in custody, call{' '}
        <a href="tel:101" className="font-semibold text-[var(--navy)] underline">
          101
        </a>
        .
      </p>
    </div>
  );
}
