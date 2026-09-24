'use client';

import { useCallback, useState } from 'react';
import { phoneToTelHref } from '@/lib/phone';
import { TurnstileWidget } from '@/components/TurnstileWidget';

type RevealPayload = {
  display: string;
  tel: string;
  sms: string;
};

/**
 * Robert Cashman profile contact block:
 * - Office landline is visible (passed in — never the mobile).
 * - Direct mobile is fetched client-side only after an explicit solicitor/agency
 *   confirm AND a Cloudflare Turnstile challenge.
 */
export function RobertProfileContact({
  officePhone,
  turnstileSiteKey = null,
}: {
  officePhone: string;
  turnstileSiteKey?: string | null;
}) {
  const [step, setStep] = useState<'closed' | 'confirm' | 'loading' | 'shown' | 'error'>('closed');
  const [confirmed, setConfirmed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [mobile, setMobile] = useState<RevealPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const officeTel = officePhone ? phoneToTelHref(officePhone) : '';

  const handleTurnstileToken = useCallback((t: string) => {
    setTurnstileToken(t);
  }, []);

  const reveal = useCallback(
    async (tokenOverride?: string) => {
      if (!confirmed) return;
      const token = (tokenOverride ?? turnstileToken).trim();
      if (!token) {
        setError('Please complete the bot-protection check before revealing.');
        setStep('error');
        return;
      }
      setStep('loading');
      setError(null);
      try {
        const res = await fetch('/api/rep/robert-cashman/direct-mobile', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          body: JSON.stringify({ turnstileToken: token }),
        });
        if (!res.ok) {
          if (res.status === 429) {
            throw new Error('Too many requests. Try again in an hour.');
          }
          if (res.status === 403) {
            throw new Error('Bot-protection check failed. Please try again.');
          }
          throw new Error('Could not load number.');
        }
        const data = (await res.json()) as RevealPayload;
        if (!data?.display || !data?.tel) throw new Error('Could not load number.');
        setMobile(data);
        setStep('shown');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load number.');
        setStep('error');
        setTurnstileToken('');
      }
    },
    [confirmed, turnstileToken],
  );

  // Auto-reveal once Turnstile issues a fresh token after the checkbox is ticked.
  const onTurnstileToken = useCallback(
    (t: string) => {
      handleTurnstileToken(t);
      if (t && confirmed) {
        void reveal(t);
      }
    },
    [confirmed, handleTurnstileToken, reveal],
  );

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
                onChange={(e) => {
                  const next = e.target.checked;
                  setConfirmed(next);
                  if (!next) {
                    setTurnstileToken('');
                    setError(null);
                  }
                }}
              />
              <span>I am instructing on behalf of a solicitors&apos; firm or agency</span>
            </label>

            {confirmed ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Complete the bot-protection check to reveal the number.
                </p>
                {turnstileSiteKey ? (
                  <TurnstileWidget
                    key={confirmed ? 'ready' : 'idle'}
                    siteKey={turnstileSiteKey}
                    onToken={onTurnstileToken}
                    action="robert-direct-mobile"
                  />
                ) : (
                  <p className="text-xs text-amber-700">
                    Bot-protection is not configured in this environment, so the direct mobile
                    cannot be revealed here.
                  </p>
                )}
                {step === 'loading' ? (
                  <p className="text-xs font-medium text-slate-600">Loading…</p>
                ) : null}
              </div>
            ) : null}

            {error ? <p className="text-xs text-red-700">{error}</p> : null}
            <button
              type="button"
              className="w-full text-center text-xs font-medium text-slate-500 underline"
              onClick={() => {
                setStep('closed');
                setConfirmed(false);
                setTurnstileToken('');
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
