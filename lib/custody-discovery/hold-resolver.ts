import {
  assessCorroboration,
  corroboratedThresholds,
  isTrustedCorroboratingSource,
  minCorroboratingSources,
} from './corroboration';
import { isGenericCustodyNumber } from './generic-numbers';
import { isAutoPublishableRange, numberSafetyFlags } from './number-safety';
import {
  evidenceContainsPhone,
  evidenceHasCustodyWording,
} from './source-evidence';
import type { CustodyAiReview, CustodyNumberFinding } from './types';

export type HoldResolutionOutcome =
  | 'publish_corroborated'
  | 'close_duplicate'
  | 'reject_force_switchboard'
  | 'reject_untrusted_only'
  | 'reject_pcc_non_custody'
  | 'flag_conflict'
  | 'unresolved';

export interface HoldResolution {
  outcome: HoldResolutionOutcome;
  detail?: string;
}

export interface HoldResolverContext {
  suiteFindings: CustodyNumberFinding[];
  /** Normalised number already published for this suite, if any. */
  approvedNormalized?: string;
  /** How many suites in the same force have this number published. */
  forceSameNumberPublishedCount: number;
  /** How many suites in the same force have open findings with this number. */
  forceSameNumberOpenCount?: number;
  /** Open + already-rejected switchboard suites for stable cluster detection. */
  forceSwitchboardClusterCount?: number;
}

const OPEN_FINDING_STATUSES = new Set<CustodyNumberFinding['status']>(['new', 'needs_review']);

/** Count distinct suites in a force with open findings sharing the same normalised number. */
export function countForceOpenFindingsSameNumber(
  forceName: string,
  normalizedPhone: string,
  allFindings: CustodyNumberFinding[],
): number {
  const suiteIds = new Set<string>();
  for (const f of allFindings) {
    if (f.forceName !== forceName) continue;
    if (!OPEN_FINDING_STATUSES.has(f.status)) continue;
    if (f.normalizedPhoneNumber !== normalizedPhone) continue;
    suiteIds.add(f.custodySuiteId);
  }
  return suiteIds.size;
}

/**
 * Distinct suites in a force tied to the same number — open findings plus
 * findings already auto-rejected as force switchboard (so backlog cleanup
 * does not lose cluster signal as items are rejected one-by-one).
 */
export function countForceSwitchboardClusterSuites(
  forceName: string,
  normalizedPhone: string,
  allFindings: CustodyNumberFinding[],
): number {
  const suiteIds = new Set<string>();
  for (const f of allFindings) {
    if (f.forceName !== forceName) continue;
    if (f.normalizedPhoneNumber !== normalizedPhone) continue;
    if (OPEN_FINDING_STATUSES.has(f.status)) {
      suiteIds.add(f.custodySuiteId);
      continue;
    }
    if (
      f.status === 'rejected' &&
      ((f.notes ?? '').includes('reject_force_switchboard') ||
        (f.notes ?? '').includes('auto_reject_force_pcc_switchboard') ||
        (f.notes ?? '').includes('likely force switchboard'))
    ) {
      suiteIds.add(f.custodySuiteId);
    }
  }
  return suiteIds.size;
}

const REP_DIRECTORY_DOMAINS = [
  'policestationreps.com',
  'policestationrepuk.org',
  'policestationrep.com',
];

export function isRepDirectoryFinding(finding: CustodyNumberFinding): boolean {
  const domain = finding.sourceDomain.toLowerCase();
  return REP_DIRECTORY_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

function isRepDirectory(finding: CustodyNumberFinding): boolean {
  return isRepDirectoryFinding(finding);
}

function openSiblingFindings(suiteFindings: CustodyNumberFinding[]): CustodyNumberFinding[] {
  return suiteFindings.filter(
    (f) => f.status !== 'rejected' && f.status !== 'stale' && f.status !== 'duplicate',
  );
}

/** Same suite + same normalised number from any open finding. */
function siblingsWithSameNumber(
  finding: CustodyNumberFinding,
  suiteFindings: CustodyNumberFinding[],
): CustodyNumberFinding[] {
  return openSiblingFindings(suiteFindings).filter(
    (f) => f.normalizedPhoneNumber === finding.normalizedPhoneNumber,
  );
}

function passesCorroboratedHardGates(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  approvedNormalized?: string,
): boolean {
  if (!isAutoPublishableRange(finding.normalizedPhoneNumber)) return false;
  if (
    finding.classification !== 'direct_custody' &&
    finding.classification !== 'direct_station' &&
    finding.classification !== 'public_enquiry'
  ) {
    return false;
  }
  if (finding.conflictReason) return false;
  if (approvedNormalized && approvedNormalized !== finding.normalizedPhoneNumber) return false;
  if (review.evidence.source !== 'page_fetch' && review.evidence.source !== 'pdf_fetch') return false;
  const wordingOk =
    finding.classification === 'direct_custody'
      ? evidenceHasCustodyWording(review.evidence)
      : evidenceHasCustodyWording(review.evidence) ||
        /enquiry|police station|front counter|telephone/i.test(
          review.evidence.quote.replace(/\*\*/g, ''),
        );
  if (!wordingOk) return false;
  if (!evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber)) return false;
  return true;
}

function minForceSwitchboardSuites(): number {
  return Math.max(3, Number(process.env.CUSTODY_FORCE_SWITCHBOARD_MIN_SUITES ?? 3));
}

function totalForceSameNumberSuites(ctx: HoldResolverContext): number {
  if (ctx.forceSwitchboardClusterCount != null) {
    return ctx.forceSwitchboardClusterCount;
  }
  return ctx.forceSameNumberPublishedCount + (ctx.forceSameNumberOpenCount ?? 0);
}

/** PCC site chrome (header phone / pfcc@) — not a station custody desk line. */
export function isPccSiteHeaderPage(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): boolean {
  if (finding.sourceType !== 'pcc') return false;
  if (review.aiConfidence >= 70) return false;
  const hay = `${review.evidence.quote} ${finding.pageSnippet}`.toLowerCase();
  const hasHeaderMarkers = /pfcc@|skip to content|open menu/i.test(hay);
  if (!hasHeaderMarkers) return false;
  if (/custody suite|custody desk|detainee|custody centre|custody center/i.test(hay)) {
    return false;
  }
  return true;
}

/**
 * Safe auto-rejects that may run even when conflictReason is set.
 * Never auto-publishes from this path.
 */
function trySafeAutoRejects(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  ctx: HoldResolverContext,
): HoldResolution | null {
  if (
    ctx.approvedNormalized &&
    ctx.approvedNormalized === finding.normalizedPhoneNumber
  ) {
    return { outcome: 'close_duplicate', detail: 'confirms_published_number' };
  }

  const forceSuites = totalForceSameNumberSuites(ctx);
  if (forceSuites >= minForceSwitchboardSuites()) {
    return {
      outcome: 'reject_force_switchboard',
      detail: `Number on ${forceSuites} suites in ${finding.forceName} (open + published) — likely force switchboard.`,
    };
  }

  if (isPccSiteHeaderPage(finding, review)) {
    return {
      outcome: 'reject_pcc_non_custody',
      detail: 'PCC site header contact — not a station custody desk line.',
    };
  }

  const corroboration = assessCorroboration(finding, ctx.suiteFindings);
  const sameNumberSiblings = siblingsWithSameNumber(finding, ctx.suiteFindings);
  const trustedAgreeing = sameNumberSiblings.filter(isTrustedCorroboratingSource);
  const untrustedOnly =
    sameNumberSiblings.length > 0 &&
    trustedAgreeing.length === 0 &&
    !isTrustedCorroboratingSource(finding);

  if (untrustedOnly || (isRepDirectory(finding) && corroboration.independentDomains.length < 2)) {
    const repOnly =
      isRepDirectory(finding) ||
      sameNumberSiblings.every((f) => isRepDirectory(f) || f.sourceType === 'solicitor_site');
    if (repOnly || untrustedOnly) {
      return {
        outcome: 'reject_untrusted_only',
        detail: 'Only third-party/rep-directory sources cite this number for the suite.',
      };
    }
  }

  return null;
}

/**
 * Deterministic cross-reference for AI "hold" findings.
 * Uses sibling findings and force-wide published patterns already in KV — no live web.
 */
export function resolveHoldFinding(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  ctx: HoldResolverContext,
): HoldResolution {
  const safeReject = trySafeAutoRejects(finding, review, ctx);
  if (safeReject) return safeReject;

  if (finding.conflictReason) {
    return { outcome: 'unresolved', detail: 'existing_conflict' };
  }

  const corroboration = assessCorroboration(finding, ctx.suiteFindings);
  if (corroboration.conflictingTrustedNumbers.length > 0) {
    return {
      outcome: 'flag_conflict',
      detail: `Trusted sources disagree: also reported ${corroboration.conflictingTrustedNumbers.join(', ')}`,
    };
  }

  const sources = corroboration.independentDomains.length;
  if (
    sources >= minCorroboratingSources() &&
    isTrustedCorroboratingSource(finding) &&
    passesCorroboratedHardGates(finding, review, ctx.approvedNormalized)
  ) {
    const { minScore } = corroboratedThresholds(sources);
    // Cross-reference substitutes for AI approve confidence on hold findings.
    if (finding.confidenceScore >= minScore) {
      return {
        outcome: 'publish_corroborated',
        detail: `${sources} independent trusted domains agree on ${finding.possiblePhoneNumber}.`,
      };
    }
  }

  return { outcome: 'unresolved' };
}

/** Deterministic reject for generic/switchboard/101/emergency numbers. */
export function isDeterministicRejectNumber(finding: CustodyNumberFinding): boolean {
  if (
    isGenericCustodyNumber(finding.normalizedPhoneNumber, finding.forceName) ||
    finding.classification === 'switchboard' ||
    finding.classification === 'general_101'
  ) {
    return true;
  }
  const flags = finding.numberFlags ?? numberSafetyFlags(finding.normalizedPhoneNumber);
  return flags.includes('emergency_number');
}

export function deterministicRejectReason(finding: CustodyNumberFinding): string {
  if (finding.classification === 'general_101') return 'general_101';
  if (finding.classification === 'switchboard') return 'switchboard';
  if (isGenericCustodyNumber(finding.normalizedPhoneNumber, finding.forceName)) {
    return 'generic_or_force_switchboard';
  }
  return 'emergency_number';
}
