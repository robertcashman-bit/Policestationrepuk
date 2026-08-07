import crypto from 'node:crypto';

/** Constant-time string comparison that doesn't leak length via early exit. */
function timingSafeEqualStrings(a: string, b: string): boolean {
  const ab = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function isCronAuthorized(request: Request, secret = process.env.CRON_SECRET): boolean {
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  if (!request?.headers) return false;
  const auth = request.headers.get('authorization') || '';
  const xSecret = request.headers.get('x-cron-secret') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  return timingSafeEqualStrings(bearer, secret) || timingSafeEqualStrings(xSecret, secret);
}

/** Cron auth or one-off bootstrap secret (for operator scripts / post-deploy kick). */
export function isOutreachBootstrapAuthorized(request: Request): boolean {
  if (isCronAuthorized(request)) return true;
  const bootstrapSecret = process.env.FIRM_OUTREACH_BOOTSTRAP_SECRET?.trim();
  if (!bootstrapSecret) return false;
  const header = request.headers.get('x-firm-outreach-bootstrap-secret') || '';
  return timingSafeEqualStrings(header, bootstrapSecret);
}
