import type { Representative } from '@/lib/types';
import { repMatchesCountyName } from '@/lib/county-matching';

/** Normalise availability into the same buckets as DirectorySearch (duplicated minimally for server-safe import). */
export function availabilityBucket(raw: string): string {
  const lower = (raw || '').toLowerCase().trim();
  if (!lower) return 'unknown';
  if (/24\s*[\/\s]?\s*7|24\s*hour|all\s*hour|anytime|any\s*time|full\s*time|any$|all$|all\s*day|mon-sun\s*24|at any time|most\s*days/i.test(lower))
    return '24-7';
  if (/evening|night|after\s*(5|6|7|8)|out\s*of\s*hours|18:30|pm\s*onwards|17:00\s*onwards/i.test(lower))
    return 'evenings-nights';
  if (/weekend|sat|sun|fri.*sat.*sun/i.test(lower)) return 'weekends';
  if (/day(time|s)|morning|afternoon|mon.*fri|9.*5|8.*6|9am|08\.|09\./i.test(lower)) return 'daytime';
  if (/flexi|arrangement|please\s*call|call\s*to|usually|general|most|majority/i.test(lower)) return 'flexible';
  return 'flexible';
}

/** Suitable for same-day / out-of-hours cover discovery (not a guarantee). */
export function isUrgentCoverCapable(rep: Representative): boolean {
  const b = availabilityBucket(rep.availability || '');
  return b === '24-7' || b === 'evenings-nights' || b === 'flexible';
}

export type ExperienceTier = '' | 'senior' | 'mid' | 'junior' | 'unspecified';

export function matchesExperienceTier(rep: Representative, tier: ExperienceTier): boolean {
  if (!tier) return true;
  const y = rep.yearsExperience;
  if (tier === 'senior') return y != null && y >= 15;
  if (tier === 'mid') return y != null && y >= 5 && y < 15;
  if (tier === 'junior') return y != null && y >= 1 && y < 5;
  if (tier === 'unspecified') return y == null || y < 1;
  return true;
}

/** 0–100 from fields present on the listing (not independent verification). */
export function profileCompleteness(rep: Representative): number {
  let n = 0;
  if (rep.name?.trim()) n += 8;
  if (rep.phone?.trim()) n += 18;
  if (rep.email?.trim()) n += 14;
  if ((rep.bio || rep.notes)?.trim()) n += 14;
  const st = rep.stations?.length ?? 0;
  if (st >= 1) n += 10;
  if (st >= 3) n += 8;
  if (rep.accreditation?.trim()) n += 10;
  if (rep.websiteUrl?.trim()) n += 6;
  if (rep.whatsappLink?.trim()) n += 4;
  if (rep.yearsExperience != null && rep.yearsExperience >= 0) n += 8;
  if ((rep.specialisms?.length ?? 0) > 0) n += 6;
  return Math.min(100, n);
}

export function isFullProfileListing(rep: Representative): boolean {
  return profileCompleteness(rep) >= 72;
}

export interface SmartRankContext {
  /** Normalised text relevance score (0+). */
  textScore: number;
  countySelected?: string;
  stationFilter?: string;
}

/**
 * Higher = better match for discovery. Used for "Recommended" ordering.
 * Does not imply regulatory vetting — only listing data signals.
 */
export function computeSmartRank(rep: Representative, ctx: SmartRankContext): number {
  let s = ctx.textScore;

  if (rep.featured) s += 420;

  s += profileCompleteness(rep) * 0.35;

  const y = rep.yearsExperience;
  if (y != null && y > 0) s += Math.min(28, Math.sqrt(y) * 5);

  if (isUrgentCoverCapable(rep)) s += 22;

  if (rep.phone?.trim() && rep.email?.trim()) s += 18;
  else if (rep.phone?.trim() || rep.email?.trim()) s += 8;

  if (ctx.countySelected && repMatchesCountyName(rep.county, ctx.countySelected)) {
    s += 95;
  }

  const stf = ctx.stationFilter?.trim().toLowerCase();
  if (stf) {
    const hit = (rep.stations || []).some((x) => {
      const sl = x.toLowerCase();
      return sl.includes(stf) || stf.includes(sl);
    });
    if (hit) s += 120;
  }

  return s;
}
