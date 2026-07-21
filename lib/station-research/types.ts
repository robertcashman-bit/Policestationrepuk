import type { SourceTier } from './force-source-registry';

export type ContactTypeCandidate =
  | 'station_public'
  | 'front_counter'
  | 'force_switchboard'
  | 'force_non_emergency'
  | 'force_geographic'
  | 'custody_suite_public'
  | 'from_abroad'
  | 'unrelated'
  | 'unknown'
  | 'do_not_publish';

export type AutonomyLevel = 1 | 2 | 3;

export type ResearchDecisionAction =
  | 'publish'
  | 'queue_admin'
  | 'reject'
  | 'needs_more_research'
  | 'leave_unchanged';

export type ConfidenceStatus =
  | 'VERIFIED'
  | 'HIGH_CONFIDENCE'
  | 'PROVISIONAL'
  | 'RESEARCH_REQUIRED'
  | 'CONFLICTED'
  | 'HISTORICAL'
  | 'REJECTED'
  | 'DO_NOT_PUBLISH'
  | 'MANUALLY_LOCKED';

export interface ResearchEvidence {
  sourceUrl: string;
  sourceTitle?: string;
  sourcePublisher?: string;
  sourceTier: SourceTier;
  excerpt: string;
  retrievalDate: string;
  contentHash?: string;
}

export interface ResearchCandidate {
  id: string;
  stationId: string;
  stationSlug: string;
  stationName: string;
  forceName?: string;
  field: 'phone' | 'openingHours' | 'address';
  rawValue: string;
  normalizedValue: string;
  displayValue: string;
  contactType: ContactTypeCandidate;
  confidenceScore: number;
  confidenceStatus: ConfidenceStatus;
  autonomyLevel: AutonomyLevel;
  evidence: ResearchEvidence[];
  decision: ResearchDecisionAction;
  decisionReasons: string[];
  uncertaintyReasons: string[];
  contradictoryEvidence: string[];
  furtherResearchRequired: boolean;
  humanReviewRequired: boolean;
  recommendedNextAction: string;
  createdAt: string;
  dryRun: boolean;
  status: 'open' | 'approved' | 'rejected' | 'published' | 'superseded';
}

export interface StationResearchPriority {
  stationId: string;
  slug: string;
  name: string;
  score: number;
  reasons: string[];
}

export interface StationResearchRunReport {
  runId: string;
  startedAt: string;
  completedAt: string;
  dryRun: boolean;
  enabled: boolean;
  stationsConsidered: number;
  stationsResearched: number;
  queriesMade: number;
  pagesFetched: number;
  candidatesFound: number;
  queuedForAdmin: number;
  published: number;
  rejected: number;
  leftUnchanged: number;
  errors: string[];
  candidates: ResearchCandidate[];
  nextRecheckHints: Array<{ stationId: string; nextResearchAt: string; reason: string }>;
}
