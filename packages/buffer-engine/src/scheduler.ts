import { createScheduledBufferPost } from './client';
import { collectGoogleBusinessPreflightIssues } from './gbp-preflight';
import { getSiteBufferEnvConfig, resolveFeedSchedule, getSchedulerDayWindow, getSchedulerNightWindow, getSchedulerEarlyMorningWindow } from './config';
import {
  appendRecentSlugs,
  buildSchedulablePostTextForService,
  generateDayNightPostTimes,
  hashSeed,
  localDateInTimezone,
  mulberry32,
  postCooldownKey,
  effectiveCooldownDays,
  slugsInCooldownForFeed,
  ensurePostTimeCount,
  addDaysToLocalDate,
} from './scheduler-core';
import type {
  BufferEngineAdapter,
  ScheduleOptions,
  ScheduleResult,
  SchedulablePost,
  SchedulerRunRecord,
  SiteBufferEnvConfig,
} from './types';
import { pickBanditSchedulablePosts, computePoolCoverage } from './bandit';
import { countSitePostsInBufferForDay } from './reconcile';
import { ensureCompliantPostImage } from './image-corrector';
import { hydratePostImagesForBuffer } from './image-url';
import {
  claimSchedulerRun,
  getRecentSlugEntries,
  getSchedulerRunForDate,
  getSlugEngagementStats,
  releaseSchedulerRunLock,
  saveRecentSlugEntries,
  saveSchedulerRun,
  saveSlugEngagementStats,
} from './storage';
import {
  bufferPostIdempotencyKey,
  claimBufferPostIdempotency,
  finalizeBufferPostIdempotency,
} from './idempotency';
import { join } from 'node:path';

function shuffleChannelsRepeated<T>(items: T[], count: number, random: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]!];
  }
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(shuffled[i % shuffled.length]!);
  }
  return out;
}

/** Append new creates onto an existing day record; dedupe by postId. */
function mergeSchedulerRunRecord(
  existing: SchedulerRunRecord | null,
  incoming: SchedulerRunRecord,
): SchedulerRunRecord {
  if (!existing) return incoming;

  const seen = new Set(existing.postIds);
  const existingFeedIds =
    existing.feedIds && existing.feedIds.length === existing.postIds.length
      ? [...existing.feedIds]
      : existing.postIds.map((_, i) => existing.feedIds?.[i] ?? '');
  const merged: SchedulerRunRecord = {
    date: incoming.date,
    scheduledAt: incoming.scheduledAt,
    postIds: [...existing.postIds],
    slugs: [...existing.slugs],
    feedIds: existingFeedIds,
    channels: [...existing.channels],
    dueAts: [...existing.dueAts],
  };

  for (let i = 0; i < incoming.postIds.length; i++) {
    const postId = incoming.postIds[i]!;
    if (seen.has(postId)) continue;
    seen.add(postId);
    merged.postIds.push(postId);
    merged.slugs.push(incoming.slugs[i] ?? '');
    merged.feedIds!.push(incoming.feedIds?.[i] ?? '');
    merged.channels.push(incoming.channels[i] ?? '');
    merged.dueAts.push(incoming.dueAts[i] ?? '');
  }

  return merged;
}

async function preparePostImages(
  adapter: BufferEngineAdapter,
  posts: SchedulablePost[],
): Promise<SchedulablePost[]> {
  const publicDir = adapter.publicDir ?? join(process.cwd(), 'public');
  const out: SchedulablePost[] = [];

  for (const post of posts) {
    const corrected = await ensureCompliantPostImage({
      siteId: adapter.siteId,
      siteUrl: adapter.siteUrl,
      slug: post.slug,
      sourceImageUrl: post.imageUrl,
      publicDir,
    });

    if (corrected) {
      if (corrected.publicUrl !== post.imageUrl && adapter.correctSourceImage) {
        await adapter.correctSourceImage({
          slug: post.slug,
          publicPath: corrected.publicPath,
          publicUrl: corrected.publicUrl,
          contentType: corrected.contentType,
        });
      }
      out.push({
        ...post,
        imageUrl: corrected.publicUrl,
        googleBusinessImageUrl: corrected.contentType === 'image/jpeg' || corrected.contentType === 'image/png'
          ? corrected.publicUrl
          : post.googleBusinessImageUrl,
      });
    } else {
      out.push(post);
    }
  }

  await hydratePostImagesForBuffer(out, adapter.siteUrl);
  return out;
}

export async function runSiteBufferScheduler(
  adapter: BufferEngineAdapter,
  options: ScheduleOptions = {},
): Promise<ScheduleResult> {
  const envConfig = getSiteBufferEnvConfig();
  const apiKey = envConfig.apiKey;
  if (!apiKey) {
    return { ok: false, reason: 'BUFFER_API_KEY is not configured' };
  }

  if (envConfig.channels.length === 0) {
    return { ok: false, reason: 'No BUFFER_CHANNEL_*_ID configured' };
  }

  const now = options.now ?? new Date();
  const timezone = envConfig.timezone;
  const localDate = localDateInTimezone(now, timezone);
  const kv = adapter.kv ?? null;

  let claimedRunLock = false;
  if (!options.force && !options.dryRun) {
    const existingRun = await getSchedulerRunForDate(kv, adapter.siteId, localDate);
    if (existingRun) {
      return {
        ok: true,
        skipped: true,
        reason: 'Already scheduled for this date',
        date: localDate,
        posts: existingRun.slugs.map((slug, i) => ({
          postId: existingRun.postIds[i] ?? '',
          slug,
          feedId: existingRun.feedIds?.[i] ?? adapter.siteId,
          channelId: existingRun.channels[i] ?? '',
          channelService: '',
          dueAt: existingRun.dueAts[i] ?? null,
          title: slug,
        })),
      };
    }

    claimedRunLock = await claimSchedulerRun(kv, adapter.siteId, localDate);
    if (!claimedRunLock) {
      const concurrentRun = await getSchedulerRunForDate(kv, adapter.siteId, localDate);
      if (concurrentRun) {
        return {
          ok: true,
          skipped: true,
          reason: 'Already scheduled for this date',
          date: localDate,
        };
      }
      return {
        ok: true,
        skipped: true,
        reason: 'Another scheduler run in progress',
        date: localDate,
      };
    }
  }

  const releaseLockIfClaimed = async () => {
    if (claimedRunLock) {
      await releaseSchedulerRunLock(kv, adapter.siteId, localDate);
      claimedRunLock = false;
    }
  };

  let runPersisted = false;
  try {
  let rawPosts = await Promise.resolve(adapter.getSchedulablePosts());
  rawPosts = rawPosts.map((p) => ({ ...p, feedId: p.feedId || adapter.siteId }));

  if (options.slugs?.length) {
    const set = new Set(options.slugs);
    rawPosts = rawPosts.filter((p) => set.has(p.slug));
  }

  const schedule = resolveFeedSchedule(envConfig);
  // `limit` is an exact create budget (gap-fill delta). Do not inflate to postsPerFeed —
  // that over-posts when only 1–2 slots remain.
  const targetCount =
    options.limit && options.limit > 0
      ? Math.min(Math.max(1, Math.floor(options.limit)), schedule.postsPerFeed)
      : schedule.postsPerFeed;
  const dayCount =
    targetCount < schedule.postsPerFeed
      ? Math.min(targetCount, schedule.dayPosts)
      : schedule.dayPosts;
  const nightCount =
    targetCount < schedule.postsPerFeed
      ? Math.max(0, targetCount - dayCount)
      : schedule.nightPosts;

  if (rawPosts.length === 0) {
    return { ok: false, reason: 'No schedulable posts available', date: localDate };
  }

  const recentEntries = await getRecentSlugEntries(kv, adapter.siteId);
  const statsMap = await getSlugEngagementStats(kv, adapter.siteId);
  const feedCooldown = effectiveCooldownDays(rawPosts.length, targetCount, envConfig.cooldownDays);
  const excludeKeys = slugsInCooldownForFeed(recentEntries, adapter.siteId, feedCooldown, now);

  // Gap-fill / force top-ups: exclude slugs already on today's run. Same-day
  // RNG was re-picking the first bandit winners → idempotent skips → Buffer
  // count stuck (live: RepUK 4/5, gapFilled=0).
  const todayRun = await getSchedulerRunForDate(kv, adapter.siteId, localDate);
  if (todayRun?.slugs?.length) {
    for (const slug of todayRun.slugs) {
      excludeKeys.add(postCooldownKey(adapter.siteId, slug));
      // Also exclude under any feedId the slug may carry.
      for (const feedId of todayRun.feedIds ?? []) {
        if (feedId) excludeKeys.add(postCooldownKey(feedId, slug));
      }
    }
  }

  // Vary seed on gap-fill so we do not deterministically re-pick the same head.
  const seedSuffix =
    options.limit && options.limit > 0 && todayRun
      ? `:gap:${todayRun.postIds.length}`
      : '';
  const rng = mulberry32(hashSeed(`buffer-engine:${adapter.siteId}:${localDate}${seedSuffix}`));
  const poolCoverage = computePoolCoverage(rawPosts, statsMap);

  let picked = pickBanditSchedulablePosts(rawPosts, {
    count: Math.min(targetCount, rawPosts.length),
    excludeKeys,
    stats: statsMap,
    explorationRate: envConfig.explorationRate,
    poolCoverage,
    random: rng,
  });

  if (picked.length < targetCount && rawPosts.length >= targetCount) {
    const fallbackRng = mulberry32(hashSeed(`buffer-fallback:${adapter.siteId}:${localDate}`));
    const extra = pickBanditSchedulablePosts(rawPosts, {
      count: targetCount - picked.length,
      excludeKeys: new Set([...excludeKeys, ...picked.map((p) => postCooldownKey(p.feedId, p.slug))]),
      stats: statsMap,
      explorationRate: 1,
      poolCoverage,
      random: fallbackRng,
    });
    picked = [...picked, ...extra];
  }

  if (picked.length === 0) {
    const reconciled = await tryReconcileExistingSchedule(
      envConfig,
      adapter,
      localDate,
      targetCount,
      kv,
    );
    if (reconciled) {
      console.info(
        `[buffer-engine:${adapter.siteId}] Reconciled day ${localDate}: ${reconciled.reason}`,
      );
      return reconciled;
    }
    return {
      ok: false,
      reason: `No posts after cooldown (pool ${rawPosts.length}, cooldown ${feedCooldown}d)`,
      date: localDate,
    };
  }

  picked = await preparePostImages(adapter, picked);

  for (const post of picked) {
    if (!post.imageUrl?.trim()) {
      return {
        ok: false,
        reason: `Post "${post.slug}" has no Buffer-compatible image after correction`,
        date: localDate,
      };
    }
  }

  let dayWindow = getSchedulerDayWindow();
  let nightWindow = getSchedulerNightWindow();

  if (options.respectCurrentTime) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    const nowSlotHour = minute > 0 ? hour + 1 : hour;
    dayWindow = {
      ...dayWindow,
      startHour: Math.min(Math.max(dayWindow.startHour, nowSlotHour), dayWindow.endHour),
      minGapMinutes: Math.min(dayWindow.minGapMinutes, 45),
    };
    nightWindow = {
      ...nightWindow,
      startHour: Math.min(Math.max(nightWindow.startHour, nowSlotHour), nightWindow.endHour),
      minGapMinutes: Math.min(nightWindow.minGapMinutes, 45),
    };
  }

  let dueAts = generateDayNightPostTimes(
    localDate,
    {
      dayCount,
      nightCount,
      dayWindow,
      nightWindow,
      earlyMorningWindow: getSchedulerEarlyMorningWindow(),
    },
    rng,
    timezone,
  );

  if (dueAts.length < picked.length) {
    dueAts = ensurePostTimeCount(
      localDate,
      dueAts,
      picked.length,
      [nightWindow, { ...getSchedulerEarlyMorningWindow(), date: addDaysToLocalDate(localDate, 1) }],
      rng,
      timezone,
    );
  }

  if (dueAts.length < picked.length) {
    return {
      ok: false,
      reason: `Could not allocate ${picked.length} schedule times (got ${dueAts.length})`,
      date: localDate,
    };
  }

  const channelOrder = shuffleChannelsRepeated(envConfig.channels, picked.length, rng);

  const gbpPosts = picked.filter((_, i) => channelOrder[i]!.service === 'googlebusiness');
  const gbpIssues = await collectGoogleBusinessPreflightIssues(gbpPosts, adapter.siteUrl);
  if (gbpIssues.length > 0) {
    return { ok: false, reason: 'GBP preflight failed', gbpIssues, date: localDate };
  }

  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      date: localDate,
      posts: picked.map((post, i) => ({
        postId: 'dry-run',
        slug: post.slug,
        feedId: post.feedId,
        channelId: channelOrder[i]!.id,
        channelService: channelOrder[i]!.service,
        dueAt: dueAts[i] ?? null,
        title: post.title,
        imageUrl: post.imageUrl,
      })),
    };
  }

  const created: NonNullable<ScheduleResult['posts']> = [];
  const newRecent = [];
  const errors: Array<{ slug: string; error: string }> = [];
  const updatedStats = new Map(statsMap);

  for (let i = 0; i < picked.length; i++) {
    const post = picked[i]!;
    const channel = channelOrder[i]!;
    const dueAt = dueAts[i]!;
    const idemKey = bufferPostIdempotencyKey({
      siteId: adapter.siteId,
      date: localDate,
      channelId: channel.id,
      slug: post.slug,
    });

    try {
      const claim = await claimBufferPostIdempotency(kv, idemKey, 'pending');
      if (!claim.claimed) {
        if (claim.existingPostId && claim.existingPostId !== 'pending') {
          console.info(
            `[buffer-engine:${adapter.siteId}] Idempotency skipped duplicate ${post.slug} on ${channel.service} (postId=${claim.existingPostId})`,
          );
          created.push({
            postId: claim.existingPostId,
            slug: post.slug,
            feedId: post.feedId,
            channelId: channel.id,
            channelService: channel.service,
            dueAt,
            title: post.title,
            imageUrl: post.imageUrl,
          });
          newRecent.push({ slug: post.slug, feedId: post.feedId, scheduledAt: now.toISOString() });
          continue;
        }
        console.info(
          `[buffer-engine:${adapter.siteId}] Idempotency in-flight for ${post.slug} on ${channel.service} — skipping`,
        );
        continue;
      }

      const text = buildSchedulablePostTextForService(post, channel.service);
      const imageUrlForChannel =
        channel.service === 'googlebusiness'
          ? (post.googleBusinessImageUrl ?? post.imageUrl)
          : post.imageUrl;

      const createdPost = await createScheduledBufferPostWithRetry(apiKey, {
        channelId: channel.id,
        channelService: channel.service,
        text,
        dueAt,
        url: post.url,
        imageUrl: imageUrlForChannel,
        imageAlt: post.imageAlt,
        feedId: post.feedId,
        siteUrl: adapter.siteUrl,
      });

      await finalizeBufferPostIdempotency(kv, idemKey, createdPost.id);

      created.push({
        postId: createdPost.id,
        slug: post.slug,
        feedId: post.feedId,
        channelId: channel.id,
        channelService: createdPost.channelService,
        dueAt: createdPost.dueAt,
        title: post.title,
        imageUrl: createdPost.imageUrl ?? post.imageUrl,
      });

      newRecent.push({ slug: post.slug, feedId: post.feedId, scheduledAt: now.toISOString() });

      const prev = updatedStats.get(post.slug) ?? {
        slug: post.slug,
        clicks: 0,
        impressions: 0,
        reactions: 0,
        timesPosted: 0,
        lastPostedAt: null,
      };
      updatedStats.set(post.slug, {
        ...prev,
        timesPosted: prev.timesPosted + 1,
        lastPostedAt: now.toISOString(),
      });
    } catch (err) {
      // Release pending claim so a later retry can re-attempt.
      if (kv?.del) {
        try {
          await kv.del(`${'buffer-engine:idem:'}${idemKey}`);
        } catch {
          // ignore
        }
      }
      errors.push({
        slug: post.slug,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (created.length === 0) {
    const reconciled = await tryReconcileExistingSchedule(
      envConfig,
      adapter,
      localDate,
      targetCount,
      kv,
    );
    if (reconciled) {
      console.info(
        `[buffer-engine:${adapter.siteId}] Reconciled after schedule failures for ${localDate}: ${reconciled.reason}`,
      );
      return reconciled;
    }
    return { ok: false, reason: 'All schedule attempts failed', date: localDate, errors };
  }

  // Gap-fill / force top-ups must append to the day's run record — replacing would
  // drop earlier post IDs and make publish verify / yesterday health under-report.
  const existingRun = await getSchedulerRunForDate(kv, adapter.siteId, localDate);
  const runRecord = mergeSchedulerRunRecord(existingRun, {
    date: localDate,
    scheduledAt: now.toISOString(),
    postIds: created.map((p) => p.postId),
    slugs: created.map((p) => p.slug),
    feedIds: created.map((p) => p.feedId),
    channels: created.map((p) => p.channelId),
    dueAts: created.map((p) => p.dueAt ?? ''),
  });
  await saveSchedulerRun(kv, adapter.siteId, runRecord);
  runPersisted = true;

  await saveRecentSlugEntries(kv, adapter.siteId, appendRecentSlugs(recentEntries, newRecent, 500));
  await saveSlugEngagementStats(kv, adapter.siteId, updatedStats);

  return {
    ok: created.length >= targetCount || rawPosts.length < targetCount,
    date: localDate,
    posts: created,
    errors: errors.length ? errors : undefined,
    reason: created.length < targetCount ? `Scheduled ${created.length}/${targetCount}` : undefined,
  };
  } finally {
    if (claimedRunLock && !runPersisted) {
      await releaseSchedulerRunLock(kv, adapter.siteId, localDate);
    }
  }
}

async function createScheduledBufferPostWithRetry(
  apiKey: string,
  input: Parameters<typeof createScheduledBufferPost>[1],
  /** Outer attempts only — GraphQL client already retries 429 with capped backoff. */
  maxAttempts = 2,
): Promise<Awaited<ReturnType<typeof createScheduledBufferPost>>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1500 * attempt));
      return await createScheduledBufferPost(apiKey, input);
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : '';
      if (!/too many requests|rate limit|429|throttl/i.test(message) || attempt === maxAttempts - 1) {
        throw err;
      }
    }
  }
  throw lastError;
}

/**
 * Before reporting failure, check KV run record and Buffer API for posts already
 * scheduled for this day — cooldown exhaustion is not a failure when the day is covered.
 */
async function tryReconcileExistingSchedule(
  envConfig: SiteBufferEnvConfig,
  adapter: BufferEngineAdapter,
  localDate: string,
  targetCount: number,
  kv: import('./types').BufferKV | null,
): Promise<ScheduleResult | null> {
  const apiKey = envConfig.apiKey;
  if (!apiKey) return null;

  const existingRun = await getSchedulerRunForDate(kv, adapter.siteId, localDate);
  if (existingRun && existingRun.postIds.length >= targetCount) {
    return {
      ok: true,
      skipped: true,
      reason: 'Already scheduled for this date',
      date: localDate,
      posts: existingRun.slugs.map((slug, i) => ({
        postId: existingRun.postIds[i] ?? '',
        slug,
        feedId: existingRun.feedIds?.[i] ?? adapter.siteId,
        channelId: existingRun.channels[i] ?? '',
        channelService: '',
        dueAt: existingRun.dueAts[i] ?? null,
        title: slug,
      })),
    };
  }

  const channelIds = envConfig.channels.map((c) => c.id);
  const bufferCount = await countSitePostsInBufferForDay(
    apiKey,
    envConfig.organizationId,
    adapter.siteUrl,
    localDate,
    envConfig.timezone,
    channelIds,
  );

  if (bufferCount.count >= targetCount) {
    return {
      ok: true,
      skipped: true,
      reconciled: true,
      scheduledInBuffer: bufferCount.count,
      reason: `Buffer already has ${bufferCount.count}/${targetCount} posts scheduled for today (cooldown exhausted)`,
      date: localDate,
    };
  }

  return null;
}
