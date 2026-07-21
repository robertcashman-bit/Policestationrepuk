import { isDialablePhone } from '@/lib/station-phone-dialable';
import { isFieldManuallyLocked } from '@/lib/station-verification';
import type { PoliceStation } from '@/lib/types';
import type { StationResearchPriority } from './types';

/**
 * Prioritise stations for continuous main-line research.
 * Higher score = research sooner.
 */
export function scoreStationResearchPriority(station: PoliceStation): StationResearchPriority {
  const reasons: string[] = [];
  let score = 0;

  const hasPhone = isDialablePhone(station.phone);
  const phoneMeta = station.verificationMeta?.fields?.phone;
  const hasSource = Boolean(phoneMeta?.sourceUrl?.startsWith('http'));

  if (!hasPhone) {
    score += 100;
    reasons.push('missing_main_phone');
  } else if (!hasSource) {
    score += 70;
    reasons.push('phone_missing_source');
  } else if (phoneMeta?.status === 'unverified') {
    score += 40;
    reasons.push('phone_unverified');
  }

  if (isFieldManuallyLocked(station, 'phone')) {
    score -= 200;
    reasons.push('manually_locked');
  }

  if (!station.openingHours) {
    score += 15;
    reasons.push('missing_opening_hours');
  }

  if (station.isCustodyStation && !isDialablePhone(station.custodyPhone)) {
    score += 10;
    reasons.push('custody_station_missing_custody_line');
  }

  const verifiedAt = phoneMeta?.dateVerified ?? station.verificationMeta?.dateVerified;
  if (verifiedAt) {
    const ageDays = (Date.now() - Date.parse(verifiedAt)) / (1000 * 60 * 60 * 24);
    if (!Number.isNaN(ageDays) && ageDays > 365) {
      score += 25;
      reasons.push('stale_verification');
    }
  } else if (hasPhone) {
    score += 20;
    reasons.push('never_verified');
  }

  return {
    stationId: station.id,
    slug: station.slug,
    name: station.name,
    score: Math.max(0, score),
    reasons,
  };
}

export function pickStationsForResearch(
  stations: PoliceStation[],
  limit: number,
): StationResearchPriority[] {
  return stations
    .map(scoreStationResearchPriority)
    .filter((p) => p.score > 0 && !p.reasons.includes('manually_locked'))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Schedule next research based on outcome risk. */
export function nextResearchAt(opts: {
  confidenceScore: number;
  published: boolean;
  conflicted: boolean;
  missing: boolean;
}): { nextResearchAt: string; reason: string } {
  const now = Date.now();
  let days = 30;
  let reason = 'stable_recheck';
  if (opts.conflicted) {
    days = 3;
    reason = 'conflict_recheck';
  } else if (opts.missing) {
    days = 7;
    reason = 'missing_recheck';
  } else if (!opts.published && opts.confidenceScore < 60) {
    days = 14;
    reason = 'low_confidence_recheck';
  } else if (opts.confidenceScore >= 85) {
    days = 90;
    reason = 'high_confidence_recheck';
  }
  return {
    nextResearchAt: new Date(now + days * 24 * 60 * 60 * 1000).toISOString(),
    reason,
  };
}
