import { phonesEquivalent } from '@/lib/phone-format';
import { isFieldManuallyLocked } from '@/lib/station-verification';
import type { PoliceStation } from '@/lib/types';
import { computeConfidence, evidenceContainsExactNumber } from './confidence';
import type { SourceTier } from './force-source-registry';
import type {
  AutonomyLevel,
  ContactTypeCandidate,
  ResearchCandidate,
  ResearchDecisionAction,
  ResearchEvidence,
} from './types';

export interface DecisionInput {
  station: PoliceStation;
  field: 'phone';
  rawValue: string;
  normalizedValue: string;
  displayValue: string;
  contactType: ContactTypeCandidate;
  contextScore: number;
  evidence: ResearchEvidence[];
  stationNameMatched: boolean;
  postcodeMatched: boolean;
  forceMatched: boolean;
  dryRun: boolean;
}

function autonomyFor(contactType: ContactTypeCandidate, bestTier: SourceTier, score: number): AutonomyLevel {
  if (contactType === 'custody_suite_public') return 3;
  if (bestTier === 1 && score >= 90 && contactType === 'station_public') return 1;
  if (bestTier <= 2 && score >= 75) return 2;
  return 3;
}

/**
 * Structured evidence-grounded decision. Never invents a number — candidate
 * must already exist in evidence excerpts.
 */
export function decideStationContactUpdate(input: DecisionInput): Omit<
  ResearchCandidate,
  'id' | 'createdAt' | 'status'
> {
  const locked = isFieldManuallyLocked(input.station, 'phone');
  const existing = input.station.phone?.trim();
  const conflictingExisting = Boolean(
    existing && !phonesEquivalent(existing, input.displayValue) && input.station.verificationMeta?.fields?.phone?.status === 'verified',
  );
  const excerptOk = evidenceContainsExactNumber(input.evidence, input.normalizedValue);
  const tiers = input.evidence.map((e) => e.sourceTier);
  const bestTier = (tiers.length ? Math.min(...tiers) : 4) as SourceTier;

  const { score, status } = computeConfidence({
    sourceTier: tiers.length ? tiers : [4],
    contactType: input.contactType,
    contextScore: input.contextScore,
    stationNameMatched: input.stationNameMatched,
    postcodeMatched: input.postcodeMatched,
    forceMatched: input.forceMatched,
    numberValid: Boolean(input.normalizedValue),
    conflictingExisting,
    manuallyLocked: locked,
    excerptContainsNumber: excerptOk,
  });

  const reasons: string[] = [];
  const uncertainty: string[] = [];
  const contradictory: string[] = [];

  if (!excerptOk) reasons.push('number_absent_from_evidence_excerpt');
  if (locked) reasons.push('field_manually_locked');
  if (conflictingExisting) {
    contradictory.push(`Existing verified phone differs: ${existing}`);
  }
  if (bestTier >= 3) uncertainty.push('source_not_official');
  if (input.contactType === 'force_switchboard' || input.contactType === 'force_non_emergency') {
    uncertainty.push('may_be_force_wide_not_station_local');
  }
  if (!input.stationNameMatched) uncertainty.push('station_name_not_clear_in_excerpt');

  let decision: ResearchDecisionAction = 'needs_more_research';
  let humanReviewRequired = true;
  let furtherResearchRequired = true;
  const level = autonomyFor(input.contactType, bestTier, score);

  if (locked || status === 'MANUALLY_LOCKED') {
    decision = 'leave_unchanged';
    humanReviewRequired = true;
    furtherResearchRequired = false;
    reasons.push('preserve_manual_lock');
  } else if (status === 'REJECTED' || status === 'DO_NOT_PUBLISH' || !excerptOk) {
    decision = 'reject';
    humanReviewRequired = false;
    furtherResearchRequired = true;
  } else if (conflictingExisting || level === 3 || score < 85) {
    decision = 'queue_admin';
    humanReviewRequired = true;
    furtherResearchRequired = false;
    reasons.push('requires_admin_review');
  } else if (level === 1 && score >= 90 && bestTier === 1) {
    decision = input.dryRun ? 'queue_admin' : 'publish';
    humanReviewRequired = input.dryRun;
    furtherResearchRequired = false;
    reasons.push(input.dryRun ? 'dry_run_blocks_publish' : 'level1_auto_publish_eligible');
  } else {
    decision = 'queue_admin';
    humanReviewRequired = true;
    reasons.push('awaiting_corroboration_or_review');
  }

  return {
    stationId: input.station.id,
    stationSlug: input.station.slug,
    stationName: input.station.name,
    forceName: input.station.forceName,
    field: input.field,
    rawValue: input.rawValue,
    normalizedValue: input.normalizedValue,
    displayValue: input.displayValue,
    contactType: input.contactType,
    confidenceScore: score,
    confidenceStatus: status,
    autonomyLevel: level,
    evidence: input.evidence,
    decision,
    decisionReasons: reasons,
    uncertaintyReasons: uncertainty,
    contradictoryEvidence: contradictory,
    furtherResearchRequired,
    humanReviewRequired,
    recommendedNextAction:
      decision === 'publish'
        ? 'Publish after gate checks'
        : decision === 'queue_admin'
          ? 'Admin review in station-contacts queue'
          : decision === 'reject'
            ? 'Reject and continue searching other official sources'
            : 'Leave existing value unchanged',
    dryRun: input.dryRun,
  };
}
