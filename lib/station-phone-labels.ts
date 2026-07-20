import type { StationPhoneEntry } from '@/lib/station-search';

/** Human-readable suffix for a directory phone line (includes unverified cue). */
export function stationPhoneEntryHint(entry: StationPhoneEntry): string {
  const parts: string[] = [];
  if (entry.className === 'switchboard') parts.push('force switchboard — not a custody desk');
  else if (entry.className === 'generic') parts.push('non-emergency');
  else if (entry.label.startsWith('Custody')) parts.push('custody desk');
  else if (entry.label === 'Station main line' || entry.label === 'Main line') {
    parts.push('station main line');
  } else {
    parts.push(entry.label);
  }
  if (!entry.verified) parts.push('unverified — please confirm or correct');
  return parts.join(' · ');
}

/** Short guidance for reps on which number to use. */
export const STATION_PHONE_CALL_GUIDANCE =
  'Custody desk for attendance; force non-emergency (usually 101) for general enquiries; 999 in an emergency.';
