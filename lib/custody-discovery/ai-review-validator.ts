import type { CustodyAiReview, CustodyNumberFinding } from './types';
import {
  evidenceContainsPhone,
  evidenceHasCustodyWording,
  evidenceHasStationOrEnquiryWording,
} from './source-evidence';

export interface AiReviewValidationResult {
  ok: boolean;
  flags: string[];
}

export function validateAiReviewOutput(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): AiReviewValidationResult {
  const flags: string[] = [...review.flags];

  if (!evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber)) {
    flags.push('ai_evidence_mismatch');
    return { ok: false, flags };
  }

  if (review.recommendation === 'approve') {
    if (finding.classification === 'direct_custody' && !evidenceHasCustodyWording(review.evidence)) {
      flags.push('no_custody_wording_in_excerpt');
      return { ok: false, flags };
    }
    if (
      (finding.classification === 'direct_station' ||
        finding.classification === 'public_enquiry') &&
      !evidenceHasStationOrEnquiryWording(review.evidence) &&
      !evidenceHasCustodyWording(review.evidence)
    ) {
      flags.push('no_station_wording_in_excerpt');
      return { ok: false, flags };
    }
  }

  const whyText = review.recommendation === 'reject' ? review.whyNot ?? '' : review.whyPublish;
  if (whyText.length < 20) {
    flags.push('explanation_too_short');
    return { ok: false, flags };
  }

  if (
    review.recommendation === 'approve' &&
    review.whyPublish.length < 40
  ) {
    flags.push('why_publish_too_short');
    return { ok: false, flags };
  }

  const suiteHint =
    finding.custodySuiteName.toLowerCase().slice(0, 8) ||
    finding.forceName.toLowerCase().slice(0, 8);
  if (
    review.recommendation === 'approve' &&
    suiteHint.length >= 4 &&
    !review.whyPublish.toLowerCase().includes(suiteHint.slice(0, 4)) &&
    !review.whyPublish.toLowerCase().includes('custody')
  ) {
    flags.push('why_publish_missing_context');
    return { ok: false, flags };
  }

  return { ok: true, flags };
}

export function downgradeReviewOnValidationFailure(
  review: CustodyAiReview,
  flags: string[],
): CustodyAiReview {
  return {
    ...review,
    recommendation: 'hold',
    flags: [...new Set([...review.flags, ...flags])],
    whyNot:
      review.whyNot ||
      'AI recommendation could not be validated against the source excerpt — manual review required.',
  };
}
