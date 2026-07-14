export type CustodySourceType =
  | 'official_police'
  | 'police_uk'
  | 'foi'
  | 'pdf'
  | 'solicitor_site'
  | 'pcc'
  | 'local_authority'
  | 'open_data'
  | 'archived'
  | 'unknown';

export type PhoneClassification =
  | 'direct_custody'
  | 'switchboard'
  | 'general_101'
  | 'solicitor_office'
  | 'victim_witness'
  | 'irrelevant'
  | 'unknown';

export type FindingStatus =
  | 'new'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'stale'
  | 'duplicate';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'reject';

export interface CustodySuite {
  id: string;
  /** Station slug for ISR revalidation after admin approval. */
  stationSlug?: string;
  forceName: string;
  forceDomain: string;
  county: string;
  custodySuiteName: string;
  policeStationName: string;
  address: string;
  postcode?: string;
  town?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Alternative / former names used in search. */
  aliases?: string[];
  operationalStatus?: string;
  publicEnquiryStatus?: string;
  custodyStatus?: string;
  /** True when the directory row is a dedicated custody suite (name/flag). */
  isDedicatedCustodySuite?: boolean;
  active: boolean;
  lastSearchedAt?: string;
  lastVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SearchAttemptStatus = 'ok' | 'empty' | 'error' | 'skipped';

export interface StationSearchAttempt {
  id: string;
  stationId: string;
  query: string;
  provider: string;
  strategy: string;
  status: SearchAttemptStatus;
  resultCount: number;
  errorCode?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt: string;
  createdAt: string;
}

/** Publication / pipeline outcome labels (admin + reporting). */
export type StationPhonePublicationStatus =
  | 'verified_direct'
  | 'verified_public_enquiry'
  | 'verified_custody'
  | 'verified_force_switchboard'
  | 'probable'
  | 'conflicting_sources'
  | 'manual_review'
  | 'no_public_number_found'
  | 'station_closed'
  | 'temporarily_unavailable'
  | 'search_failed';

export type AiReviewRecommendation = 'approve' | 'reject' | 'hold';

export type SourceEvidenceKind = 'page_fetch' | 'search_snippet' | 'pdf_unfetched' | 'pdf_fetch';

export interface SourceEvidence {
  quote: string;
  section: string;
  sourceUrl: string;
  sourceTitle: string;
  source: SourceEvidenceKind;
  fetchedAt: string;
}

export interface CustodyAiReview {
  recommendation: AiReviewRecommendation;
  aiConfidence: number;
  whyPublish: string;
  whyNot?: string;
  evidence: SourceEvidence;
  publishVerified: boolean;
  flags: string[];
  model: string;
  reviewedAt: string;
}

export type NumberSafetyFlag =
  | 'mobile_number'
  | 'premium_rate'
  | 'emergency_number'
  | 'invalid_length';

export interface CustodyNumberFinding {
  id: string;
  custodySuiteId: string;
  forceName: string;
  custodySuiteName: string;
  policeStationName: string;
  possiblePhoneNumber: string;
  normalizedPhoneNumber: string;
  /** E.164 format (+44…) where derivable. */
  e164?: string | null;
  /** UK number-range safety flags (mobile / premium-rate / etc.). */
  numberFlags?: NumberSafetyFlag[];
  sourceTitle: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceType: CustodySourceType;
  pageSnippet: string;
  classification: PhoneClassification;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  status: FindingStatus;
  dateFound: string;
  lastChecked: string;
  hashOfSourceEvidence: string;
  notes: string;
  conflictReason?: string;
  aiReview?: CustodyAiReview;
  autoPublishedAt?: string;
  autoRejectedAt?: string;
  /** How many times AI review re-ran because the source page fetch failed. */
  aiEvidenceRetries?: number;
  createdAt: string;
  updatedAt: string;
}

export type DiscoveryVerificationStatus = 'unverified' | 'verified';

export interface ApprovalAuditEntry {
  at: string;
  actor: string;
  action:
    | 'approved'
    | 'auto_approved'
    | 'rejected'
    | 'marked_verified'
    | 'recheck_ok'
    | 'recheck_source_missing'
    | 'recheck_number_missing'
    | 'recheck_conflict'
    | 'corroborated'
    | 'unsafe_number_flagged';
  detail?: string;
}

export interface ApprovedCustodyNumber {
  id: string;
  custodySuiteId: string;
  stationSlug?: string;
  phoneNumber: string;
  normalizedPhoneNumber: string;
  /** E.164 format (+44…) where derivable. */
  e164?: string | null;
  sourceFindingId: string;
  sourceUrl: string;
  approvedBy: string;
  approvedAt: string;
  lastVerifiedAt: string;
  /** Published in directory; starts unverified unless high confidence or admin marks verified. */
  verificationStatus: DiscoveryVerificationStatus;
  publicVisible: boolean;
  notes: string;
  auditLog?: ApprovalAuditEntry[];
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

export interface CrawlerRunStats {
  suitesScanned: number;
  searchesRun: number;
  numbersExtracted: number;
  findingsCreated: number;
  findingsUpdated: number;
  findingsRejected: number;
  conflictsFlagged: number;
  officialPagesFetched: number;
  pageFetchesUsed: number;
  batchCursor: number;
  batchStartIndex: number;
  batchTotal: number;
  scannedSuiteIds: string[];
  elapsedMs: number;
}
