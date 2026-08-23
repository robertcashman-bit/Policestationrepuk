/**
 * Bounds for /api/cron/firm-outreach-status eligibility probes.
 * Kept out of the route module — Next.js only allows specific route exports.
 *
 * Dual 1200-row candidate selects under maxDuration=60 caused live verify 504s.
 */
export const STATUS_ELIGIBILITY_READY_LIMIT = 40;
export const STATUS_ELIGIBILITY_SENT_LIMIT = 20;
export const STATUS_ELIGIBILITY_MAX_READY_SCAN = 120;
