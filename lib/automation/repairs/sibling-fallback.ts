/**
 * REPUK-side Buffer fallback when a sibling has no /api/buffer/schedule
 * (currently custodynote.com — marketing site, no RSS / no Buffer cron).
 *
 * Schedules promo posts that link to live sibling URLs so cross-site quota
 * can recover today. Does not invent blog articles.
 */
import { createScheduledBufferPost, listPostsInWindow } from '@robertcashman/buffer-engine';
import type { BufferChannelService } from '@/lib/buffer/config';
import {
  getBufferApiKey,
  getBufferOrganizationId,
  getSchedulerDayWindow,
  getSchedulerTimezone,
} from '@/lib/buffer/config';
import {
  generateRandomPostTimes,
  hashSeed,
  localDateInTimezone,
  mulberry32,
  timezoneOffsetForDate,
  withBufferSocialUtm,
} from '@/lib/buffer/scheduler-core';
import type { CrossSiteBufferTarget } from '@/lib/buffer/cross-site-sites';
import { countSiteSentPosts } from '@/lib/buffer/verify-cross-site';
import { SITE_URL } from '@/lib/seo-layer/config';
import { googleBusinessFeedFallbackUrl } from '@/lib/buffer/image-url';
import { logAutomationEvent } from '../observability';

export interface SiblingFallbackResult {
  attempted: boolean;
  verified: boolean;
  scheduled: number;
  needed: number;
  summary: string;
  dryRun: boolean;
}

interface PromoCandidate {
  slug: string;
  title: string;
  excerpt: string;
  path: string;
}

/** Live marketing URLs on custodynote.com (verified 200 as of 2026-08-11). */
const CUSTODYNOTE_PROMOS: PromoCandidate[] = [
  {
    slug: 'home',
    title: 'Custody Note — attendance notes for police station reps',
    excerpt:
      'Native Windows and Mac apps for structured police station attendance notes. Start free on custodynote.com.',
    path: '/',
  },
  {
    slug: 'download',
    title: 'Download Custody Note for Windows PC and Mac',
    excerpt:
      'Install Custody Note on Windows 10+ or macOS 11+ (Apple Silicon and Intel). Free to start.',
    path: '/download',
  },
  {
    slug: 'trial',
    title: 'Try Custody Note free',
    excerpt:
      'Structured custody and attendance notes for criminal defence practitioners. Start your free trial.',
    path: '/trial',
  },
  {
    slug: 'pricing',
    title: 'Custody Note pricing',
    excerpt:
      'Simple pricing for police station representatives and criminal solicitors. See plans on custodynote.com.',
    path: '/pricing',
  },
  {
    slug: 'buy',
    title: 'Get Custody Note Pro',
    excerpt:
      'Upgrade to Custody Note Pro for full attendance-note workflows across Windows and Mac.',
    path: '/buy',
  },
  {
    slug: 'cloud-backup',
    title: 'Custody Note cloud backup',
    excerpt:
      'Keep attendance notes safe with Custody Note cloud backup. Learn more on custodynote.com.',
    path: '/cloud-backup',
  },
];

/** Live URLs on psrtrain.com when the sibling scheduler returns 0 posts. */
const PSRTRAIN_PROMOS: PromoCandidate[] = [
  {
    slug: 'home',
    title: 'PSR Train — police station representative training',
    excerpt:
      'Interactive PSRAS preparation, timed MCQs, and CIT-style scenarios for trainee police station reps.',
    path: '/',
  },
  {
    slug: 'training',
    title: 'PSR Train training modules',
    excerpt:
      'Structured training modules for police station accreditation support on psrtrain.com.',
    path: '/training',
  },
  {
    slug: 'guides',
    title: 'PSR Train guides for trainee reps',
    excerpt:
      'Practical guides on PSRAS, disclosure, and police station practice — free on psrtrain.com/guides.',
    path: '/guides',
  },
  {
    slug: 'blog',
    title: 'PSR Train blog',
    excerpt:
      'Articles for police station representatives preparing for accreditation and day-one practice.',
    path: '/blog',
  },
  {
    slug: 'pricing',
    title: 'PSR Train pricing',
    excerpt: 'See PSR Train plans for interactive police station representative training.',
    path: '/pricing',
  },
];

const CHANNEL_SERVICE_BY_ID: Record<string, BufferChannelService> = {
  '69d26c06031bfa423cd0c50d': 'linkedin',
  '69d26c3d031bfa423cd0c6b3': 'twitter',
  '69d26c8b031bfa423cd0c8b7': 'googlebusiness',
  '6a304bd838b55793459b4247': 'facebook',
  '6a304bd838b55793459b4248': 'facebook',
  '6a304bd938b55793459b4255': 'facebook',
};

function promoUrl(hostname: string, path: string): string {
  const base = `https://${hostname.replace(/^www\./, '')}`;
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildPromoText(
  promo: PromoCandidate,
  hostname: string,
  feedId: string,
  service: BufferChannelService,
): { text: string; url: string } {
  const url = withBufferSocialUtm(promoUrl(hostname, promo.path), feedId, service);
  const text = `${promo.title}\n\n${promo.excerpt}\n\n${url}`;
  if (service === 'twitter' && text.length > 280) {
    const short = `${promo.title}\n\n${url}`;
    return { text: short.slice(0, 280), url };
  }
  return { text, url };
}

export function siblingFallbackPromos(siteId: string): PromoCandidate[] {
  if (siteId === 'custodynote') return CUSTODYNOTE_PROMOS;
  if (siteId === 'psrtrain') return PSRTRAIN_PROMOS;
  return [];
}

/**
 * Schedule remaining today-quota posts from REPUK when sibling self-scheduler
 * endpoints are missing. Only sites with a static promo catalog are supported.
 */
export async function scheduleSiblingFallbackFromRepuk(
  site: CrossSiteBufferTarget,
  options?: {
    dryRun?: boolean;
    now?: Date;
    fetchFn?: typeof fetch;
  },
): Promise<SiblingFallbackResult> {
  const dryRun = Boolean(options?.dryRun);
  const promos = siblingFallbackPromos(site.id);
  if (promos.length === 0) {
    return {
      attempted: false,
      verified: false,
      scheduled: 0,
      needed: 0,
      summary: `${site.hostname}: no REPUK fallback catalog (deploy sibling /api/buffer/schedule)`,
      dryRun,
    };
  }

  const apiKey = getBufferApiKey();
  const orgId = getBufferOrganizationId();
  if (!apiKey) {
    return {
      attempted: false,
      verified: false,
      scheduled: 0,
      needed: 0,
      summary: `${site.hostname}: fallback skipped (BUFFER_API_KEY missing)`,
      dryRun,
    };
  }

  const timezone = getSchedulerTimezone();
  const now = options?.now ?? new Date();
  const today = localDateInTimezone(now, timezone);
  const tomorrow = (() => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const dayStart = `${today}T00:00:00${timezoneOffsetForDate(today, timezone)}`;
  const dayEnd = `${tomorrow}T00:00:00${timezoneOffsetForDate(tomorrow, timezone)}`;

  const existing = await listPostsInWindow(apiKey, orgId, {
    status: ['scheduled', 'sent'],
    dueAtStart: dayStart,
    dueAtEnd: dayEnd,
    channelIds: site.channelIds,
  });
  const already = countSiteSentPosts(existing, site.hostname);
  const required = site.requiredPostsPerDay ?? 5;
  const needed = Math.max(0, required - already);

  if (needed === 0) {
    return {
      attempted: false,
      verified: true,
      scheduled: 0,
      needed: 0,
      summary: `${site.hostname}: today already at quota (${already}/${required}) — no fallback needed`,
      dryRun,
    };
  }

  if (dryRun) {
    return {
      attempted: false,
      verified: false,
      scheduled: 0,
      needed,
      summary: `${site.hostname}: would schedule ${needed} REPUK fallback promo post(s) (today ${already}/${required})`,
      dryRun: true,
    };
  }

  const rng = mulberry32(hashSeed(`sibling-fallback:${site.id}:${today}`));
  const dayWindow = getSchedulerDayWindow();
  // Prefer remaining hours today so gap-fill posts are not scheduled in the past.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const currentHour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const adjustedWindow = {
    ...dayWindow,
    startHour: Math.min(Math.max(dayWindow.startHour, currentHour), Math.max(dayWindow.endHour - 1, 0)),
    minGapMinutes: Math.min(dayWindow.minGapMinutes, 30),
  };
  const times = generateRandomPostTimes(today, needed, adjustedWindow, rng, timezone);
  const channels = site.channelIds
    .map((id) => ({ id, service: CHANNEL_SERVICE_BY_ID[id] }))
    .filter((c): c is { id: string; service: BufferChannelService } => Boolean(c.service));

  if (channels.length === 0) {
    return {
      attempted: false,
      verified: false,
      scheduled: 0,
      needed,
      summary: `${site.hostname}: fallback skipped (no mapped Buffer channels)`,
      dryRun: false,
    };
  }

  const usedSlugs = new Set(
    existing
      .map((p) => {
        const m = p.text.match(/https?:\/\/[^\s)]+/);
        if (!m) return null;
        try {
          const path = new URL(m[0]).pathname.replace(/\/$/, '') || '/';
          return path === '/' ? 'home' : path.split('/').filter(Boolean).pop() ?? null;
        } catch {
          return null;
        }
      })
      .filter(Boolean),
  );

  const available = promos.filter((p) => !usedSlugs.has(p.slug));
  const pickPool = available.length > 0 ? available : promos;
  const siteUrl = SITE_URL.replace(/\/$/, '');
  const imageUrl = googleBusinessFeedFallbackUrl(site.id, siteUrl);

  let scheduled = 0;
  const errors: string[] = [];

  for (let i = 0; i < needed; i++) {
    const promo = pickPool[i % pickPool.length]!;
    const channel = channels[i % channels.length]!;
    const dueAt = times[i] ?? times[times.length - 1];
    if (!dueAt) {
      errors.push('no dueAt generated');
      continue;
    }
    const { text, url } = buildPromoText(promo, site.hostname, site.id, channel.service);
    try {
      await createScheduledBufferPost(apiKey, {
        channelId: channel.id,
        channelService: channel.service,
        text,
        dueAt,
        url,
        // Always attach a self-hosted raster — Buffer rejects posts with no image URL.
        imageUrl,
        imageAlt: promo.title,
        feedId: site.id,
        siteUrl,
      });
      scheduled += 1;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  const verified = scheduled >= needed;
  logAutomationEvent('crosssite.quota.repaired', {
    siteId: site.id,
    via: 'repuk_fallback',
    scheduled,
    needed,
  });

  return {
    attempted: true,
    verified,
    scheduled,
    needed,
    summary: verified
      ? `${site.hostname}: REPUK fallback scheduled ${scheduled}/${needed} (today was ${already}/${required})`
      : `${site.hostname}: REPUK fallback partial ${scheduled}/${needed}${errors[0] ? ` — ${errors[0].slice(0, 120)}` : ''}`,
    dryRun: false,
  };
}
