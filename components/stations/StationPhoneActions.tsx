'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import type { PoliceStation } from '@/lib/types';
import { stationPhoneNumbers } from '@/lib/station-search';
import { phoneToTelHref } from '@/lib/phone';
import { formatPhoneUk } from '@/lib/phone-format';
import {
  DEFAULT_NON_EMERGENCY,
  getOfficialContact,
} from '@/lib/official-force-contacts';
import {
  getCustodyPublicDisplay,
  getFieldPublicationMeta,
  getPublishedPhoneValue,
} from '@/lib/station-contacts/publish';
import { isCustodyStation } from '@/lib/custody-station';
import { CUSTODY_NOT_PUBLISHED_TEXT } from '@/lib/station-contacts/types';
import { STATION_PHONE_CALL_GUIDANCE } from '@/lib/station-phone-labels';
import { stationPhoneReportHref } from '@/lib/station-phone-report';

function forceNonEmergency(station: PoliceStation): { number: string; hint: string } {
  const raw = getOfficialContact(station.forceName)?.nonEmergency ?? DEFAULT_NON_EMERGENCY;
  const number = formatPhoneUk(raw) || raw;
  const hint =
    station.forceName === 'British Transport Police'
      ? 'BTP non-emergency'
      : number === '101'
        ? 'Call 101 (non-emergency)'
        : 'Force non-emergency';
  return { number, hint };
}

function CopyPhoneButton({ number, className }: { number: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }, [number]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ??
        'inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-[var(--navy)]/15 bg-white px-4 py-2.5 text-sm font-bold text-[var(--navy)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold-light)]'
      }
    >
      {copied ? 'Copied!' : 'Copy number'}
    </button>
  );
}

interface PhoneActionRowProps {
  label: string;
  number: string;
  compact?: boolean;
  bright?: boolean;
  stationId?: string;
  field?: 'phone' | 'custodyPhone';
  sourceUrl?: string;
}

function PhoneActionRow({
  label,
  number,
  compact,
  bright,
  stationId,
  field,
  sourceUrl,
}: PhoneActionRowProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</span>
        <a
          href={phoneToTelHref(number)}
          className="font-mono text-base font-semibold text-[var(--gold-link)] no-underline hover:underline"
        >
          {number}
        </a>
        <CopyPhoneButton
          number={number}
          className="inline-flex min-h-[36px] items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-[var(--navy)] hover:border-[var(--gold)]/50"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p
        className={`text-xs font-bold uppercase tracking-wide ${
          bright ? 'text-[var(--navy)]' : 'text-[var(--muted)]'
        }`}
      >
        {label}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <a
          href={phoneToTelHref(number)}
          className={
            bright
              ? 'flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-[var(--gold)] px-4 py-3 text-base font-extrabold text-[var(--navy)] no-underline shadow-sm transition-colors hover:bg-[var(--gold-hover)] sm:text-lg'
              : 'flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[var(--navy)] px-4 py-3 text-base font-semibold text-white no-underline transition-colors hover:bg-[var(--navy-light)]'
          }
        >
          Call {number}
        </a>
        <CopyPhoneButton
          number={number}
          className={
            bright
              ? 'inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-[var(--navy)]/20 bg-white px-5 text-sm font-bold text-[var(--navy)] hover:border-[var(--gold)] hover:bg-white sm:min-w-[140px]'
              : undefined
          }
        />
      </div>
      {bright && (sourceUrl || (stationId && field)) ? (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--gold-link)] underline hover:text-[var(--navy)]"
            >
              View official source
            </a>
          ) : null}
          {stationId && field ? (
            <Link
              href={stationPhoneReportHref(stationId, {
                field,
                number,
                reason: field === 'custodyPhone' ? 'not_custody' : 'wrong',
              })}
              className="text-[var(--gold-link)] hover:underline"
            >
              {field === 'custodyPhone' ? 'Not the custody desk?' : 'Wrong number?'}
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export interface StationPhoneActionsProps {
  station: PoliceStation;
  compact?: boolean;
  /** Bright hero styling for the station page first viewport. */
  bright?: boolean;
}

export function StationPhoneActions({
  station,
  compact = false,
  bright = false,
}: StationPhoneActionsProps) {
  const entries = stationPhoneNumbers(station);
  const custody = isCustodyStation(station);
  const custodyDisplay = custody ? getCustodyPublicDisplay(station) : null;
  const { number: neNumber, hint } = forceNonEmergency(station);
  const custodyMeta = getFieldPublicationMeta(station, 'custodyPhone');
  const phoneMeta = getFieldPublicationMeta(station, 'phone');

  const publishedMain = getPublishedPhoneValue(station, 'phone');
  const mainEntry =
    publishedMain &&
    (entries.find(
      (e) => e.label === 'Station main line' || e.label === 'Main line' || e.label === 'Station',
    ) ?? {
      label: 'Station main line',
      number: publishedMain,
      className: 'station' as const,
      verified: true,
    });
  const custodyEntry = entries.find((e) => e.label.startsWith('Custody'));

  const spacing = compact ? 'space-y-2' : bright ? 'space-y-5' : 'space-y-4';

  return (
    <div className={spacing}>
      {custody && custodyDisplay?.published && custodyEntry ? (
        <PhoneActionRow
          label="Custody desk"
          number={custodyEntry.number}
          compact={compact}
          bright={bright}
          stationId={station.id}
          field="custodyPhone"
          sourceUrl={custodyMeta.sourceUrl}
        />
      ) : custody ? (
        <p
          className={
            bright
              ? 'rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900'
              : 'text-sm text-amber-800'
          }
        >
          {CUSTODY_NOT_PUBLISHED_TEXT}
        </p>
      ) : null}

      {mainEntry ? (
        <PhoneActionRow
          label="Station main line"
          number={mainEntry.number}
          compact={compact}
          bright={bright}
          stationId={station.id}
          field="phone"
          sourceUrl={phoneMeta.sourceUrl}
        />
      ) : null}

      {entries
        .filter((e) => e !== mainEntry && e !== custodyEntry)
        .map((entry) => (
          <PhoneActionRow
            key={`${entry.label}-${entry.number}`}
            label={entry.label}
            number={entry.number}
            compact={compact}
            bright={bright}
          />
        ))}

      <div
        className={
          compact
            ? 'text-xs text-[var(--muted)]'
            : bright
              ? 'grid gap-3 border-t-2 border-[var(--gold)]/40 pt-4 sm:grid-cols-2'
              : 'space-y-1 border-t border-[var(--border)] pt-3'
        }
      >
        <div>
          <p
            className={
              compact
                ? ''
                : 'text-xs font-bold uppercase tracking-wide text-[var(--navy)]'
            }
          >
            Force non-emergency
          </p>
          {compact ? (
            <a
              href={phoneToTelHref(neNumber)}
              className="font-mono font-medium text-[var(--gold-link)] no-underline hover:underline"
            >
              {neNumber}
            </a>
          ) : (
            <a
              href={phoneToTelHref(neNumber)}
              className={
                bright
                  ? 'mt-1 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-900 no-underline hover:bg-emerald-100'
                  : 'flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]'
              }
            >
              {neNumber} ({hint})
            </a>
          )}
        </div>
        {!compact ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--navy)]">Emergency</p>
            <p
              className={
                bright
                  ? 'mt-1 flex min-h-[48px] items-center justify-center rounded-xl bg-red-50 px-4 text-lg font-extrabold text-red-700'
                  : 'text-xs text-[var(--muted)]'
              }
            >
              {bright ? '999' : (
                <>
                  Emergency: <strong className="text-[var(--navy)]">999</strong>
                </>
              )}
            </p>
          </div>
        ) : null}
      </div>

      {bright ? (
        <p className="text-sm leading-snug text-[var(--navy)]/80">{STATION_PHONE_CALL_GUIDANCE}</p>
      ) : null}
    </div>
  );
}
