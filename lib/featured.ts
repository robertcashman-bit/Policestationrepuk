import { getKV } from './kv';
import type { Representative } from './types';

export const ROBERT_SLUG = 'robert-cashman';
export const ROBERT_EMAIL = 'robertdavidcashman@gmail.com';

export interface FeaturedMeta {
  email: string;
  activatedAt: string;
  emailSentToRep: boolean;
  emailSentToOwner: boolean;
}

let _featuredFlags: Map<string, FeaturedMeta> | null = null;
let _featuredFlagsAt = 0;
const CACHE_MS = 60_000;

export async function loadFeaturedFlags(): Promise<Map<string, FeaturedMeta>> {
  const now = Date.now();
  if (_featuredFlags && now - _featuredFlagsAt < CACHE_MS) {
    return _featuredFlags;
  }
  const map = new Map<string, FeaturedMeta>();
  const kv = getKV();
  if (!kv) { _featuredFlags = map; _featuredFlagsAt = now; return map; }
  try {
    const keys = await kv.keys('featured:*');
    if (keys.length === 0) { _featuredFlags = map; _featuredFlagsAt = now; return map; }
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const results = await pipeline.exec<(FeaturedMeta | null)[]>();
    for (const row of results) {
      if (row && typeof row === 'object' && typeof row.email === 'string') {
        map.set(row.email.toLowerCase(), row);
      }
    }
  } catch (err) {
    console.error('[featured] Failed to load featured flags from KV:', err);
  }
  _featuredFlags = map;
  _featuredFlagsAt = now;
  return map;
}

export function invalidateFeaturedCache(): void {
  _featuredFlags = null;
  _featuredFlagsAt = 0;
}

export async function getFeaturedStatus(email: string): Promise<FeaturedMeta | null> {
  const kv = getKV();
  if (!kv) return null;
  try {
    return await kv.get<FeaturedMeta>(`featured:${email.toLowerCase()}`);
  } catch {
    return null;
  }
}

export async function activateFeatured(email: string): Promise<FeaturedMeta> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  const meta: FeaturedMeta = {
    email: email.toLowerCase(),
    activatedAt: new Date().toISOString(),
    emailSentToRep: false,
    emailSentToOwner: false,
  };
  await kv.set(`featured:${email.toLowerCase()}`, meta);
  invalidateFeaturedCache();
  return meta;
}

export async function markEmailsSent(email: string, flags: { rep?: boolean; owner?: boolean }): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const existing = await kv.get<FeaturedMeta>(`featured:${email.toLowerCase()}`);
  if (!existing) return;
  const updated = {
    ...existing,
    emailSentToRep: flags.rep ?? existing.emailSentToRep,
    emailSentToOwner: flags.owner ?? existing.emailSentToOwner,
  };
  await kv.set(`featured:${email.toLowerCase()}`, updated);
}

export function applyFeaturedFlags(
  reps: Representative[],
  flags: Map<string, FeaturedMeta>,
): Representative[] {
  if (flags.size === 0) return reps;
  return reps.map((r) => {
    if (r.featured) return r;
    const meta = flags.get(r.email.toLowerCase());
    if (meta) return { ...r, featured: true };
    return r;
  });
}

/**
 * Deterministic sort for featured reps:
 * 1. Robert Cashman always first
 * 2. Then by activatedAt DESC (newest first)
 * 3. Then by name ASC
 */
export function sortFeaturedReps(
  reps: Representative[],
  flags: Map<string, FeaturedMeta>,
): Representative[] {
  return [...reps].sort((a, b) => {
    const aIsRobert = a.slug === ROBERT_SLUG || a.email.toLowerCase() === ROBERT_EMAIL;
    const bIsRobert = b.slug === ROBERT_SLUG || b.email.toLowerCase() === ROBERT_EMAIL;
    if (aIsRobert && !bIsRobert) return -1;
    if (!aIsRobert && bIsRobert) return 1;

    const aMeta = flags.get(a.email.toLowerCase());
    const bMeta = flags.get(b.email.toLowerCase());
    const aTime = aMeta?.activatedAt ? new Date(aMeta.activatedAt).getTime() : 0;
    const bTime = bMeta?.activatedAt ? new Date(bMeta.activatedAt).getTime() : 0;

    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}
