import {
  MAGISTRATES_CAT_1A,
  POLICE_STATION_ESCAPE_THRESHOLD,
  POLICE_STATION_FIXED_FEE,
  SUPERSEDED_POLICE_STATION_FIXED_FEES,
  formatGbpWhole,
} from '@/lib/laa-rates';
import { excerpt } from './rules';
import type { RedFlag } from './types';

/**
 * Compare page copy that asserts current LAA police-station / magistrates rates
 * against the canonical figures in lib/laa-rates.ts.
 */
export function scanFeeRateClaims(text: string): RedFlag[] {
  const flags: RedFlag[] = [];

  for (const amount of SUPERSEDED_POLICE_STATION_FIXED_FEES) {
    const re = new RegExp(
      `(?:police\\s+station|fixed\\s+fee|harmonised|legal\\s+aid|LAA|standard\\s+fee)[^£]{0,80}£${amount}\\b|£${amount}\\b[^.]{0,80}(?:police\\s+station|fixed\\s+fee|harmonised)`,
      'i',
    );
    const m = re.exec(text);
    if (!m) continue;
    // Historical framing is OK
    if (
      /pre[-\s]?22|before\s+22|UFNs?\s+before|historical|superseded|old\s+rate|prior\s+to\s+22|2024\/25/i.test(
        text.slice(Math.max(0, m.index - 60), m.index + 120),
      )
    ) {
      continue;
    }
    flags.push({
      severity: 'PROBLEM',
      code: `fee-rate-mismatch-${amount}`,
      message: `Page asserts £${amount} as a current police-station fee; canonical rate is ${formatGbpWhole(POLICE_STATION_FIXED_FEE)} (lib/laa-rates.ts / SI 2025/1251)`,
      excerpt: excerpt(text, m.index),
    });
  }

  // Wrong "current" police-station fixed fee (not the canonical £320)
  const fixedFeeClaim =
    /(?:harmonised|police\s+station)\s+(?:fixed\s+)?fee[^£\d]{0,40}£(\d{2,4}(?:\.\d{2})?)/gi;
  let m: RegExpExecArray | null;
  while ((m = fixedFeeClaim.exec(text)) !== null) {
    const claimed = parseFloat(m[1]);
    if (!Number.isFinite(claimed)) continue;
    if (claimed === POLICE_STATION_FIXED_FEE || claimed === POLICE_STATION_FIXED_FEE + 0.0) continue;
    if (claimed === 320.0) continue;
    if (
      /pre[-\s]?22|before\s+22|UFNs?\s+before|historical|superseded|old\s+rate|prior\s+to/i.test(
        text.slice(Math.max(0, m.index - 80), m.index + 100),
      )
    ) {
      continue;
    }
    flags.push({
      severity: 'PROBLEM',
      code: 'fee-rate-mismatch-police-station',
      message: `Page claims police-station fixed fee £${m[1]}; canonical is ${formatGbpWhole(POLICE_STATION_FIXED_FEE)} (lib/laa-rates.ts)`,
      excerpt: excerpt(text, m.index),
    });
  }

  const escapeClaim =
    /escape\s+threshold[^£\d]{0,40}£(\d{2,4}(?:\.\d{2})?)/gi;
  while ((m = escapeClaim.exec(text)) !== null) {
    const claimed = parseFloat(m[1]);
    if (!Number.isFinite(claimed)) continue;
    if (claimed === POLICE_STATION_ESCAPE_THRESHOLD) continue;
    if (
      /pre[-\s]?22|before\s+22|UFNs?\s+before|historical|superseded|old\s+rate|prior\s+to/i.test(
        text.slice(Math.max(0, m.index - 80), m.index + 100),
      )
    ) {
      continue;
    }
    flags.push({
      severity: 'PROBLEM',
      code: 'fee-rate-mismatch-escape',
      message: `Page claims escape threshold £${m[1]}; canonical is ${formatGbpWhole(POLICE_STATION_ESCAPE_THRESHOLD)} (lib/laa-rates.ts)`,
      excerpt: excerpt(text, m.index),
    });
  }

  // Magistrates Category 1A lower standard — flag clear wrong figures near the label
  const mag1a =
    /Category\s*1A[^£]{0,120}(?:lower[^£]{0,40})?£(\d{2,4}(?:\.\d{2})?)/i.exec(text);
  if (mag1a) {
    const claimed = parseFloat(mag1a[1]);
    if (
      Number.isFinite(claimed) &&
      Math.abs(claimed - MAGISTRATES_CAT_1A.lowerStandard) > 0.011 &&
      Math.abs(claimed - MAGISTRATES_CAT_1A.higherStandard) > 0.011
    ) {
      flags.push({
        severity: 'REVIEW',
        code: 'fee-rate-mismatch-magistrates-1a',
        message: `Magistrates Category 1A figure £${mag1a[1]} does not match canonical ${MAGISTRATES_CAT_1A.lowerStandard} / ${MAGISTRATES_CAT_1A.higherStandard} (lib/laa-rates.ts)`,
        excerpt: excerpt(text, mag1a.index),
      });
    }
  }

  return flags;
}
