import { revalidatePath } from 'next/cache';
import { formatAiReviewNotes } from './ai-review';
import type { CustodyAiReview, CustodyNumberFinding } from './types';
import {
  assessCorroboration,
  corroboratedThresholds,
  isTrustedCorroboratingSource,
  minCorroboratingSources,
} from './corroboration';
import {
  pickConflictWinner,
  scoreConflictCandidate,
  type SuiteConflictResolution,
} from './conflict-resolver';
import {
  countForceOpenFindingsSameNumber,
  countForceSwitchboardClusterSuites,
  deterministicRejectReason,
  isDeterministicRejectNumber,
  isPccSiteHeaderPage,
  isRepDirectoryFinding,
  resolveHoldFinding,
  type HoldResolutionOutcome,
} from './hold-resolver';
import { isAutoPublishableRange, numberSafetyFlags } from './number-safety';
import {
  evidenceContainsPhone,
  evidenceHasCustodyWording,
  evidenceHasStationOrEnquiryWording,
  isStrongEvidenceSource,
} from './source-evidence';
import { isOfficialSourceType } from './source-type';
import {
  appendAuditEntry,
  approveFinding,
  getAllFindings,
  getApprovedNumber,
  getCustodySuite,
  getFindingsForSuite,
  loadAllApprovedNumbers,
  rejectFinding,
  saveApprovedNumber,
  saveFinding,
  getFinding,
} from './storage';
import type { PhoneClassification } from './types';

const PUBLISHABLE_CLASSIFICATIONS = new Set<PhoneClassification>([
  'direct_custody',
  'direct_station',
  'public_enquiry',
]);

export function autoPublishEnabled(): boolean {
  return process.env.CUSTODY_AI_AUTO_PUBLISH !== 'false';
}

/** revalidatePath throws outside a Next request scope (e.g. operator tsx scripts). */
function safeRevalidate(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    /* running outside Next — ISR revalidation not needed */
  }
}

export function autoRejectEnabled(): boolean {
  return process.env.CUSTODY_AI_AUTO_REJECT !== 'false';
}

export function autoConflictResolveEnabled(): boolean {
  return process.env.CUSTODY_AI_AUTO_RESOLVE_CONFLICTS !== 'false';
}

function evidenceRetryLimit(): number {
  return Math.max(0, Number(process.env.CUSTODY_EVIDENCE_RETRY_LIMIT ?? 3));
}

/** Snippet-only or unfetched PDF — not enough to publish; reject unless still retrying. */
export function shouldAutoRejectWeakEvidence(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): boolean {
  if (isStrongEvidenceSource(review.evidence.source)) return false;
  if (review.recommendation === 'approve') return true;
  if (isRepDirectoryFinding(finding)) return true;
  return (finding.aiEvidenceRetries ?? 0) >= evidenceRetryLimit();
}

function minApproveConfidence(): number {
  return Number(process.env.CUSTODY_AI_MIN_APPROVE_CONFIDENCE ?? 92);
}

/** Soft auto-publish when AI strongly approves but rule score is just under 85. */
function softApproveConfidence(): number {
  return Number(process.env.CUSTODY_AI_SOFT_APPROVE_CONFIDENCE ?? 85);
}

function softApproveMinScore(): number {
  return Number(process.env.CUSTODY_AI_SOFT_APPROVE_MIN_SCORE ?? 70);
}

/**
 * Auto-reject whenever AI recommends reject. Conflicts still block
 * auto-publish but do not block clearing reject recommendations from the queue.
 */
export function shouldAutoRejectAiFinding(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): { reject: true; reason: string; note: string } | { reject: false } {
  if (review.recommendation !== 'reject') return { reject: false };

  const conf = review.aiConfidence;
  if (isRepDirectoryFinding(finding)) {
    return {
      reject: true,
      reason: 'auto_reject_rep_directory',
      note: `AI reject (${conf}%) from rep/self directory (${finding.sourceDomain}) — not an authoritative source.`,
    };
  }

  return {
    reject: true,
    reason: 'auto_reject_ai',
    note: `AI reject (${conf}%) — not a publishable custody desk line.`,
  };
}

export interface AutoDecisionResult {
  action: 'published' | 'rejected' | 'queued' | 'closed_duplicate';
  reason?: string;
}

async function forceSwitchboardClusterCount(finding: CustodyNumberFinding): Promise<number> {
  const all = await getAllFindings();
  const cluster = countForceSwitchboardClusterSuites(
    finding.forceName,
    finding.normalizedPhoneNumber,
    all,
  );
  const published = await countForcePublishedSameNumber(
    finding.forceName,
    finding.normalizedPhoneNumber,
  );
  return Math.max(cluster, published);
}

async function forceOpenSameNumberCount(finding: CustodyNumberFinding): Promise<number> {
  const all = await getAllFindings();
  return countForceOpenFindingsSameNumber(
    finding.forceName,
    finding.normalizedPhoneNumber,
    all,
  );
}

const HOLD_AUTO_REJECT_OUTCOMES = new Set<HoldResolutionOutcome>([
  'reject_force_switchboard',
  'reject_untrusted_only',
  'reject_pcc_non_custody',
]);

async function tryHoldSafeAutoReject(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  approvedNormalized?: string,
): Promise<AutoDecisionResult | null> {
  const suiteFindings = await getFindingsForSuite(finding.custodySuiteId);
  const forcePublished = await countForcePublishedSameNumber(
    finding.forceName,
    finding.normalizedPhoneNumber,
  );
  const forceOpen = await forceOpenSameNumberCount(finding);
  const clusterCount = await forceSwitchboardClusterCount(finding);
  const resolution = resolveHoldFinding(finding, review, {
    suiteFindings,
    approvedNormalized,
    forceSameNumberPublishedCount: forcePublished,
    forceSameNumberOpenCount: forceOpen,
    forceSwitchboardClusterCount: clusterCount,
  });
  if (!HOLD_AUTO_REJECT_OUTCOMES.has(resolution.outcome)) {
    return null;
  }
  if (!autoRejectEnabled()) {
    return { action: 'queued', reason: resolution.outcome };
  }
  return autoRejectFinding(
    finding,
    review,
    resolution.outcome,
    resolution.detail ?? resolution.outcome,
  );
}

/**
 * When no publishable conflict winner exists, reject force-wide PCC header clusters.
 */
async function bulkRejectForcePccSwitchboardCluster(
  forceName: string,
  normalizedPhone: string,
): Promise<number> {
  const allFindings = await getAllFindings();
  const open = allFindings.filter(
    (f) =>
      f.forceName === forceName &&
      f.normalizedPhoneNumber === normalizedPhone &&
      (f.status === 'needs_review' || f.status === 'new') &&
      f.aiReview?.reviewedAt &&
      f.sourceType === 'pcc',
  );
  const suiteIds = new Set(open.map((f) => f.custodySuiteId));
  if (suiteIds.size < Math.max(3, Number(process.env.CUSTODY_FORCE_SWITCHBOARD_MIN_SUITES ?? 3))) {
    return 0;
  }
  if (!open.every((f) => isPccSiteHeaderPage(f, f.aiReview!))) {
    return 0;
  }

  let rejectedCount = 0;
  for (const f of open) {
    await autoRejectFinding(
      f,
      f.aiReview!,
      'auto_reject_force_pcc_switchboard',
      `Same PCC header number (${f.possiblePhoneNumber}) on ${suiteIds.size} ${forceName} suites — force switchboard, not custody desk.`,
    );
    rejectedCount++;
  }
  return rejectedCount;
}

async function countForcePublishedSameNumber(
  forceName: string,
  normalizedPhone: string,
): Promise<number> {
  const approvedMap = await loadAllApprovedNumbers();
  let count = 0;
  for (const [suiteId, record] of approvedMap) {
    if (!record.publicVisible) continue;
    if (record.normalizedPhoneNumber !== normalizedPhone) continue;
    const suite = await getCustodySuite(suiteId);
    if (suite?.forceName === forceName) count++;
  }
  return count;
}

/** Findings whose number range can never be published from a non-official source. */
function isUnsafeNonOfficialNumber(finding: CustodyNumberFinding): boolean {
  const flags = finding.numberFlags ?? numberSafetyFlags(finding.normalizedPhoneNumber);
  const unsafe = flags.includes('mobile_number') || flags.includes('premium_rate');
  return unsafe && !isOfficialSourceType(finding.sourceType);
}

async function autoRejectFinding(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  reason: string,
  note: string,
): Promise<AutoDecisionResult> {
  const now = new Date().toISOString();
  const notes = [`[Auto ${now.slice(0, 10)}] ${reason} — ${note}`, formatAiReviewNotes(review)]
    .filter(Boolean)
    .join('\n');
  await rejectFinding(finding.id, notes);
  await saveFinding({
    ...finding,
    aiReview: review,
    autoRejectedAt: now,
    notes,
    status: 'rejected',
    updatedAt: now,
  });
  return { action: 'rejected', reason };
}

/** Exported for conflict resolution and queue reprocessing. */
export async function autoRejectWithReason(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  reason: string,
  note: string,
): Promise<AutoDecisionResult> {
  return autoRejectFinding(finding, review, reason, note);
}

/**
 * Finding confirms the number already published for this suite:
 * close it as a duplicate, and if it is a fresh trusted source with real
 * page evidence, count it as a free re-verification of the published record.
 */
async function closeDuplicateConfirmation(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): Promise<void> {
  const now = new Date().toISOString();
  await saveFinding({
    ...finding,
    aiReview: review,
    status: 'duplicate',
    notes: [`[Auto ${now.slice(0, 10)}] Confirms the already-published number for this suite.`, finding.notes]
      .filter(Boolean)
      .join('\n'),
    updatedAt: now,
  });

  if (
    isTrustedCorroboratingSource(finding) &&
    isStrongEvidenceSource(review.evidence.source) &&
    evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber)
  ) {
    const approved = await getApprovedNumber(finding.custodySuiteId);
    if (approved?.publicVisible && approved.normalizedPhoneNumber === finding.normalizedPhoneNumber) {
      const updated = appendAuditEntry(
        { ...approved, lastVerifiedAt: now },
        {
          actor: 'ai-reviewer',
          action: 'corroborated',
          detail: `Independent source confirms number: ${finding.sourceUrl}`,
        },
      );
      await saveApprovedNumber(updated);
    }
  }
}

/** Hold reviews lack whyPublish — synthesise one for corroborated auto-publish. */
function reviewForCorroboratedPublish(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): CustodyAiReview {
  const whyPublish =
    review.whyPublish && review.whyPublish.length >= 40
      ? review.whyPublish
      : `Cross-reference: ${review.whyNot || `Multiple trusted sources agree this is the ${finding.custodySuiteName} custody desk line.`}`.slice(
          0,
          400,
        );
  return {
    ...review,
    recommendation: 'approve',
    aiConfidence: Math.max(review.aiConfidence, 60),
    whyPublish,
  };
}

async function tryAutoPublish(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  existingApproved: Awaited<ReturnType<typeof getApprovedNumber>>,
  pathLabel: 'hold_corroborated' | 'approve',
): Promise<AutoDecisionResult> {
  const suite = await getCustodySuite(finding.custodySuiteId);
  const suiteFindings = await getFindingsForSuite(finding.custodySuiteId);
  const gates = canAutoPublish(
    finding,
    review,
    existingApproved?.normalizedPhoneNumber,
    suite?.forceDomain,
    suiteFindings,
  );
  if (!gates.ok) {
    return { action: 'queued', reason: gates.reason };
  }

  const pathNote =
    gates.path === 'corroborated' || pathLabel === 'hold_corroborated'
      ? '[Auto-published via hold cross-reference / multi-source corroboration]'
      : gates.path === 'ai_soft'
        ? '[Auto-published via AI soft approve — unverified pending recheck]'
        : '[Auto-published via official source]';
  const notes = [pathNote, formatAiReviewNotes(review)].join('\n');
  const result = await approveFinding(finding.id, 'ai-reviewer', {
    notes,
    markVerified:
      gates.path === 'official' &&
      review.publishVerified &&
      finding.confidenceScore >= 80,
  });
  if (!result) {
    return { action: 'queued', reason: 'approve_failed' };
  }

  const now = new Date().toISOString();
  await saveFinding({
    ...result.finding,
    aiReview: review,
    autoPublishedAt: now,
    notes,
  });
  safeRevalidate('/StationsDirectory');
  safeRevalidate('/admin/custody-number-review');
  if (result.approved.stationSlug) {
    safeRevalidate(`/police-station/${result.approved.stationSlug}`);
  }
  return {
    action: 'published',
    reason: pathLabel === 'hold_corroborated' ? 'auto_publish_hold_corroborated' : `auto_publish_${gates.path}`,
  };
}

/** Exported for conflict resolution. */
export async function autoPublishEligibleFinding(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  pathLabel: 'hold_corroborated' | 'approve',
): Promise<AutoDecisionResult> {
  const existingApproved = await getApprovedNumber(finding.custodySuiteId);
  const reviewForPublish =
    pathLabel === 'hold_corroborated' ? reviewForCorroboratedPublish(finding, review) : review;
  return tryAutoPublish(finding, reviewForPublish, existingApproved, pathLabel);
}

export async function applyAutoDecision(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): Promise<AutoDecisionResult> {
  if (finding.status === 'approved' || finding.status === 'rejected') {
    return { action: 'queued', reason: 'already_finalized' };
  }

  const existingApproved = await getApprovedNumber(finding.custodySuiteId);

  if (
    existingApproved?.publicVisible &&
    existingApproved.normalizedPhoneNumber === finding.normalizedPhoneNumber
  ) {
    await closeDuplicateConfirmation(finding, review);
    return { action: 'closed_duplicate', reason: 'confirms_published_number' };
  }

  if (autoRejectEnabled() && isUnsafeNonOfficialNumber(finding)) {
    return autoRejectFinding(
      finding,
      review,
      'unsafe_number_non_official',
      'Mobile/premium-rate number from a non-official source — never publishable.',
    );
  }

  if (autoRejectEnabled() && isDeterministicRejectNumber(finding)) {
    const kind = deterministicRejectReason(finding);
    return autoRejectFinding(
      finding,
      review,
      `deterministic_${kind}`,
      `Generic/switchboard/emergency number (${kind}) — not a custody desk line.`,
    );
  }

  if (review.recommendation === 'reject' && autoRejectEnabled()) {
    const rejectGate = shouldAutoRejectAiFinding(finding, review);
    if (rejectGate.reject) {
      return autoRejectFinding(finding, review, rejectGate.reason, rejectGate.note);
    }
  }

  if (
    autoRejectEnabled() &&
    isRepDirectoryFinding(finding) &&
    review.recommendation !== 'reject'
  ) {
    return autoRejectFinding(
      finding,
      review,
      'auto_reject_rep_directory',
      `Rep/self directory (${finding.sourceDomain}) — not an authoritative custody source.`,
    );
  }

  if (autoRejectEnabled() && shouldAutoRejectWeakEvidence(finding, review)) {
    return autoRejectFinding(
      finding,
      review,
      'auto_reject_weak_evidence',
      'Insufficient page evidence (search snippet or unfetched PDF) — cannot verify number on source.',
    );
  }

  if (finding.conflictReason && autoRejectEnabled()) {
    const safeReject = await tryHoldSafeAutoReject(
      finding,
      review,
      existingApproved?.normalizedPhoneNumber,
    );
    if (safeReject) return safeReject;
  }

  if (finding.conflictReason && autoConflictResolveEnabled()) {
    const resolution = await resolveSuiteConflicts(finding.custodySuiteId);
    const refreshed = (await getFinding(finding.id)) ?? finding;
    if (refreshed.status === 'rejected') {
      return { action: 'rejected', reason: 'conflict_loser' };
    }
    if (refreshed.status === 'approved' || refreshed.autoPublishedAt) {
      return { action: 'published', reason: 'conflict_winner' };
    }
    if (resolution.action === 'published' && resolution.winningFindingId === finding.id) {
      return { action: 'published', reason: 'conflict_winner' };
    }
    finding = refreshed;
    review = refreshed.aiReview ?? review;
  }

  if (finding.conflictReason) {
    return { action: 'queued', reason: 'conflict' };
  }

  if (review.recommendation === 'approve' && autoPublishEnabled()) {
    return tryAutoPublish(finding, review, existingApproved, 'approve');
  }

  if (review.recommendation === 'hold') {
    const suiteFindings = await getFindingsForSuite(finding.custodySuiteId);
    const forceCount = await countForcePublishedSameNumber(
      finding.forceName,
      finding.normalizedPhoneNumber,
    );
    const forceOpen = await forceOpenSameNumberCount(finding);
    const clusterCount = await forceSwitchboardClusterCount(finding);
    const resolution = resolveHoldFinding(finding, review, {
      suiteFindings,
      approvedNormalized: existingApproved?.normalizedPhoneNumber,
      forceSameNumberPublishedCount: forceCount,
      forceSameNumberOpenCount: forceOpen,
      forceSwitchboardClusterCount: clusterCount,
    });

    switch (resolution.outcome) {
      case 'close_duplicate':
        await closeDuplicateConfirmation(finding, review);
        return { action: 'closed_duplicate', reason: 'confirms_published_number' };

      case 'reject_force_switchboard':
      case 'reject_untrusted_only':
      case 'reject_pcc_non_custody':
        if (!autoRejectEnabled()) {
          return { action: 'queued', reason: resolution.outcome };
        }
        return autoRejectFinding(
          finding,
          review,
          resolution.outcome,
          resolution.detail ?? resolution.outcome,
        );

      case 'flag_conflict': {
        const now = new Date().toISOString();
        await saveFinding({
          ...finding,
          aiReview: review,
          conflictReason: 'possible_conflict',
          notes: [`[Auto ${now.slice(0, 10)}] ${resolution.detail}`, finding.notes]
            .filter(Boolean)
            .join('\n'),
          updatedAt: now,
        });
        return { action: 'queued', reason: 'hold_crossref_conflict' };
      }

      case 'publish_corroborated':
        if (!autoPublishEnabled()) {
          return { action: 'queued', reason: 'hold_corroborated_publish_disabled' };
        }
        return tryAutoPublish(
          finding,
          reviewForCorroboratedPublish(finding, review),
          existingApproved,
          'hold_corroborated',
        );

      default:
        // Unresolved holds: clear low-value / weak evidence instead of emailing humans.
        if (autoRejectEnabled() && shouldAutoRejectUnresolvedHold(finding, review)) {
          return autoRejectFinding(
            finding,
            review,
            'auto_reject_unresolved_hold',
            'AI hold without publishable evidence — cleared automatically.',
          );
        }
        return { action: 'queued', reason: 'needs_human' };
    }
  }

  if (
    autoRejectEnabled() &&
    review.recommendation === 'hold' &&
    shouldAutoRejectUnresolvedHold(finding, review)
  ) {
    return autoRejectFinding(
      finding,
      review,
      'auto_reject_unresolved_hold',
      'AI hold without publishable evidence — cleared automatically.',
    );
  }

  return { action: 'queued', reason: 'needs_human' };
}

/** Holds that are not worth a human email — weak score, untrusted source, or timid AI. */
export function shouldAutoRejectUnresolvedHold(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): boolean {
  if (finding.conflictReason) return false;
  if (isRepDirectoryFinding(finding)) return true;
  if (!isTrustedCorroboratingSource(finding) && !isOfficialSourceType(finding.sourceType)) {
    return true;
  }
  if (finding.confidenceScore < 45) return true;
  if (review.aiConfidence < 45) return true;
  if (!isStrongEvidenceSource(review.evidence.source)) return true;
  if (!evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber)) return true;
  return false;
}

/** Auto-publish rule score floor (spec: >= 85 with an official source). */
const AUTO_PUBLISH_MIN_RULE_SCORE = 85;

function sourceDomainIsOfficialForForce(
  sourceDomain: string,
  forceDomain?: string,
): boolean {
  const src = sourceDomain.toLowerCase().replace(/^www\./, '');
  if (!src) return false;
  if (src === 'police.uk' || src.endsWith('.police.uk')) return true;
  if (forceDomain) {
    const force = forceDomain.toLowerCase().replace(/^www\./, '');
    if (force && (src === force || src.endsWith(`.${force}`))) return true;
  }
  return false;
}

export type AutoPublishGateResult =
  | { ok: true; path: 'official' | 'corroborated' | 'ai_soft' }
  | { ok: false; reason: string };

function hardGates(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  approvedNormalized?: string,
): { ok: true } | { ok: false; reason: string } {
  if (!isAutoPublishableRange(finding.normalizedPhoneNumber)) {
    const flags = finding.numberFlags ?? numberSafetyFlags(finding.normalizedPhoneNumber);
    return { ok: false, reason: flags[0] ?? 'number_range_not_publishable' };
  }
  if (!PUBLISHABLE_CLASSIFICATIONS.has(finding.classification)) {
    return { ok: false, reason: 'not_publishable_classification' };
  }
  if (finding.conflictReason) {
    return { ok: false, reason: 'conflict' };
  }
  if (approvedNormalized && approvedNormalized !== finding.normalizedPhoneNumber) {
    return { ok: false, reason: 'different_approved_number' };
  }
  if (!isStrongEvidenceSource(review.evidence.source)) {
    return { ok: false, reason: 'weak_evidence' };
  }
  const wordingOk =
    finding.classification === 'direct_custody'
      ? evidenceHasCustodyWording(review.evidence)
      : evidenceHasStationOrEnquiryWording(review.evidence) ||
        evidenceHasCustodyWording(review.evidence);
  if (!wordingOk) {
    return {
      ok: false,
      reason:
        finding.classification === 'direct_custody'
          ? 'no_custody_wording'
          : 'no_station_wording',
    };
  }
  if (!evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber)) {
    return { ok: false, reason: 'phone_not_in_excerpt' };
  }
  if (!review.whyPublish || review.whyPublish.length < 40) {
    return { ok: false, reason: 'why_publish_missing' };
  }
  return { ok: true };
}

function canAutoPublish(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  approvedNormalized?: string,
  forceDomain?: string,
  suiteFindings: CustodyNumberFinding[] = [],
): AutoPublishGateResult {
  const hard = hardGates(finding, review, approvedNormalized);
  if (!hard.ok) return hard;

  const officialPath =
    isOfficialSourceType(finding.sourceType) &&
    sourceDomainIsOfficialForForce(finding.sourceDomain, forceDomain) &&
    review.aiConfidence >= minApproveConfidence() &&
    finding.confidenceScore >= AUTO_PUBLISH_MIN_RULE_SCORE;
  if (officialPath) return { ok: true, path: 'official' };

  if (isTrustedCorroboratingSource(finding)) {
    const corroboration = assessCorroboration(finding, suiteFindings);
    if (corroboration.conflictingTrustedNumbers.length > 0) {
      return { ok: false, reason: 'corroboration_conflict' };
    }
    const sources = corroboration.independentDomains.length;
    if (sources >= minCorroboratingSources()) {
      const { minAi, minScore } = corroboratedThresholds(sources);
      if (review.aiConfidence >= minAi && finding.confidenceScore >= minScore) {
        return { ok: true, path: 'corroborated' };
      }
      return { ok: false, reason: 'corroborated_confidence_low' };
    }
  }

  // Soft path: AI strongly approves with page evidence on a trusted/official source,
  // publish as unverified so the human queue does not grow with near-miss approvals.
  const softEligible =
    (isOfficialSourceType(finding.sourceType) || isTrustedCorroboratingSource(finding)) &&
    review.aiConfidence >= softApproveConfidence() &&
    finding.confidenceScore >= softApproveMinScore() &&
    isStrongEvidenceSource(review.evidence.source) &&
    evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber);
  if (softEligible) {
    return { ok: true, path: 'ai_soft' };
  }

  if (!isOfficialSourceType(finding.sourceType)) {
    return { ok: false, reason: 'insufficient_corroboration' };
  }
  if (!sourceDomainIsOfficialForForce(finding.sourceDomain, forceDomain)) {
    return { ok: false, reason: 'source_domain_not_official' };
  }
  if (review.aiConfidence < minApproveConfidence()) {
    return { ok: false, reason: 'ai_confidence_low' };
  }
  return { ok: false, reason: 'rule_score_low' };
}

export { canAutoPublish };

/**
 * Pick a publishable winner when sources disagree, publish unverified, reject losers.
 */
export async function resolveSuiteConflicts(
  custodySuiteId: string,
): Promise<SuiteConflictResolution> {
  if (!autoConflictResolveEnabled() || !autoPublishEnabled()) {
    return { action: 'none', rejectedCount: 0, reason: 'disabled' };
  }

  const suite = await getCustodySuite(custodySuiteId);
  const suiteFindings = await getFindingsForSuite(custodySuiteId);
  const approved = await getApprovedNumber(custodySuiteId);
  const open = suiteFindings.filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') && f.aiReview?.reviewedAt,
  );

  if (open.length === 0) {
    return { action: 'none', rejectedCount: 0, reason: 'no_open_findings' };
  }

  const distinctNumbers = new Set(open.map((f) => f.normalizedPhoneNumber));
  const hasConflict = open.some((f) => f.conflictReason) || distinctNumbers.size > 1;
  if (!hasConflict) {
    return { action: 'none', rejectedCount: 0, reason: 'no_conflict' };
  }

  const candidates: Array<{
    finding: CustodyNumberFinding;
    review: CustodyAiReview;
    score: number;
  }> = [];

  for (const f of open) {
    const review = f.aiReview;
    if (!review) continue;
    const score = scoreConflictCandidate(
      f,
      review,
      suiteFindings,
      suite?.forceDomain,
      approved?.normalizedPhoneNumber,
    );
    if (score === null) continue;
    candidates.push({ finding: f, review, score });
  }

  const winner = pickConflictWinner(candidates);
  if (!winner) {
    if (autoRejectEnabled()) {
      let rejectedCount = 0;
      for (const f of open) {
        if (!isRepDirectoryFinding(f)) continue;
        await autoRejectFinding(
          f,
          f.aiReview!,
          'auto_reject_rep_directory_conflict',
          'Rep/self directory source — not authoritative for conflict resolution.',
        );
        rejectedCount++;
      }
      if (rejectedCount > 0) {
        return { action: 'rejected_only', rejectedCount, reason: 'rep_directory_cleared' };
      }

      const distinctNumbers = [...new Set(open.map((f) => f.normalizedPhoneNumber))];
      if (distinctNumbers.length === 1 && suite?.forceName) {
        const pccRejected = await bulkRejectForcePccSwitchboardCluster(
          suite.forceName,
          distinctNumbers[0]!,
        );
        if (pccRejected > 0) {
          return {
            action: 'rejected_only',
            rejectedCount: pccRejected,
            reason: 'auto_reject_force_pcc_switchboard',
          };
        }
      }
    }
    return { action: 'none', rejectedCount: 0, reason: 'no_publishable_winner' };
  }

  const gates = canAutoPublish(
    { ...winner.finding, conflictReason: undefined },
    winner.review,
    approved?.normalizedPhoneNumber,
    suite?.forceDomain,
    suiteFindings,
  );
  if (!gates.ok) {
    return { action: 'none', rejectedCount: 0, reason: gates.reason };
  }

  const winningNumber = winner.finding.normalizedPhoneNumber;
  let rejectedCount = 0;

  for (const f of open) {
    if (f.id === winner.finding.id) continue;
    if (f.normalizedPhoneNumber === winningNumber) {
      await saveFinding({
        ...f,
        conflictReason: undefined,
        updatedAt: new Date().toISOString(),
      });
      continue;
    }
    if (!autoRejectEnabled()) continue;
    await autoRejectFinding(
      f,
      f.aiReview!,
      'auto_reject_conflict_loser',
      `Conflict resolution: published ${winner.finding.possiblePhoneNumber} from ${winner.finding.sourceDomain}.`,
    );
    rejectedCount++;
  }

  await saveFinding({
    ...winner.finding,
    conflictReason: undefined,
    updatedAt: new Date().toISOString(),
  });

  const publishResult = await autoPublishEligibleFinding(
    { ...winner.finding, conflictReason: undefined },
    winner.review,
    gates.path === 'corroborated' ? 'hold_corroborated' : 'approve',
  );

  if (publishResult.action !== 'published') {
    return {
      action: 'rejected_only',
      rejectedCount,
      reason: publishResult.reason ?? 'publish_failed',
    };
  }

  return {
    action: 'published',
    winningFindingId: winner.finding.id,
    rejectedCount,
    reason: 'conflict_winner_published',
  };
}

/**
 * Re-run auto-decision gates on an existing finding (backlog cleanup).
 * Uses the stored aiReview without re-fetching source pages.
 */
export async function reapplyAutoDecision(
  finding: CustodyNumberFinding,
): Promise<AutoDecisionResult> {
  if (!finding.aiReview?.reviewedAt) {
    return { action: 'queued', reason: 'no_ai_review' };
  }
  return applyAutoDecision(finding, finding.aiReview);
}
