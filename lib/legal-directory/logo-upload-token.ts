/**
 * Short-lived, one-shot tokens that authorise a single logo upload to
 * Vercel Blob. Minted by POST /api/legal-directory/logo-token (rate-limited)
 * or accepted alongside a valid management token / admin session.
 */
import crypto from 'node:crypto';
import { getKV } from '@/lib/kv';

const TOKEN_KV_PREFIX = 'legaldir-logo-upload:';
export const LOGO_UPLOAD_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

function tokenKey(token: string): string {
  return `${TOKEN_KV_PREFIX}${token}`;
}

/** Mint a one-shot upload token. Returns null when KV is unavailable. */
export async function mintLogoUploadToken(): Promise<string | null> {
  const kv = getKV();
  if (!kv) {
    // Local/dev without KV: return an ephemeral signed-ish token that the
    // consume path accepts via in-memory fallback below.
    return mintInMemoryToken();
  }
  const token = crypto.randomUUID();
  await kv.set(tokenKey(token), { createdAt: Date.now() }, { ex: LOGO_UPLOAD_TOKEN_TTL_SECONDS });
  return token;
}

/** Consume (one-shot) a logo upload token. Returns true if valid. */
export async function consumeLogoUploadToken(token: string | null | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string' || token.length < 16) return false;

  const kv = getKV();
  if (!kv) {
    return consumeInMemoryToken(token);
  }

  const key = tokenKey(token);
  // Atomic get-and-delete so concurrent POSTs cannot both observe a valid token.
  const existing = await kv.getdel<{ createdAt: number }>(key);
  return Boolean(existing);
}

/**
 * Restore a previously consumed one-shot token (e.g. Blob put() failed after
 * consume). Best-effort — short remaining TTL is fine.
 */
export async function restoreLogoUploadToken(token: string | null | undefined): Promise<void> {
  if (!token || typeof token !== 'string' || token.length < 16) return;
  const kv = getKV();
  if (!kv) {
    memoryTokens.set(token, Date.now() + LOGO_UPLOAD_TOKEN_TTL_SECONDS * 1000);
    return;
  }
  try {
    await kv.set(tokenKey(token), { createdAt: Date.now() }, { ex: LOGO_UPLOAD_TOKEN_TTL_SECONDS });
  } catch {
    /* ignore — caller already returns 500 */
  }
}

/** In-memory fallback for local/preview without KV. */
const memoryTokens = new Map<string, number>();

function mintInMemoryToken(): string {
  const token = crypto.randomUUID();
  memoryTokens.set(token, Date.now() + LOGO_UPLOAD_TOKEN_TTL_SECONDS * 1000);
  // Bound memory growth
  if (memoryTokens.size > 5_000) {
    const now = Date.now();
    for (const [k, exp] of memoryTokens) {
      if (exp < now) memoryTokens.delete(k);
    }
  }
  return token;
}

function consumeInMemoryToken(token: string): boolean {
  const exp = memoryTokens.get(token);
  if (exp == null) return false;
  memoryTokens.delete(token);
  return exp >= Date.now();
}
