#!/usr/bin/env npx tsx
/**
 * Repair scheduled Buffer posts whose image URLs 404 (esp. custodynote screenshots)
 * or that are missing assets.
 *
 * Usage:
 *   npm run buffer:repair-dead-images            # dry-run
 *   npm run buffer:repair-dead-images -- --apply
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createScheduledBufferPost,
  deleteBufferPost,
  listScheduledBufferPosts,
  type BufferScheduledPostSummary,
} from '../lib/buffer/client';
import {
  getBufferApiKey,
  getBufferOrganizationId,
  getSchedulerTimezone,
  type BufferChannelService,
} from '../lib/buffer/config';
import { FEED_DEFAULT_IMAGES, loadAllFeedPosts } from '../lib/buffer/feeds';
import {
  extractArticleUrlFromText,
  parseFeedFromArticleUrl,
  slugFromPostText,
} from '../lib/buffer/article-url';
import { probeBufferImageUrl } from '../lib/buffer/image-url';
import {
  addDaysToLocalDate,
  buildSchedulablePostTextForService,
  localDateInTimezone,
  timezoneOffsetForDate,
} from '../lib/buffer/scheduler-core';
import type { SchedulablePost } from '../lib/buffer/content-types';

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isDeadScreenshotUrl(url: string | undefined): boolean {
  return !!url && /custodynote\.com\/screenshots\//i.test(url);
}

function titleKey(text: string): string {
  return text
    .split('\n')[0]
    .split('—')[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findFeedPost(
  post: BufferScheduledPostSummary,
  byFeed: Map<string, SchedulablePost[]>,
): SchedulablePost | undefined {
  const articleUrl = extractArticleUrlFromText(post.text);
  const feedId = articleUrl ? parseFeedFromArticleUrl(articleUrl) : 'custodynote';
  const posts = byFeed.get(feedId) ?? byFeed.get('custodynote') ?? [];
  const slug = slugFromPostText(post.text);
  if (slug) {
    const bySlug = posts.find((p) => p.slug === slug);
    if (bySlug) return bySlug;
  }
  const key = titleKey(post.text);
  if (!key) return undefined;
  return posts.find((p) => titleKey(p.title) === key);
}

async function withRateLimitRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      if (attempt > 0) await sleep(20_000 * attempt);
      return await fn();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!/too many requests/i.test(message) || attempt >= 7) throw err;
      console.warn(`[repair-dead-images] Rate limited on ${label}, retry ${attempt + 1}/7…`);
    }
  }
  throw lastError;
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.production.local');

  const apply = process.argv.includes('--apply');
  const apiKey = getBufferApiKey();
  if (!apiKey) throw new Error('BUFFER_API_KEY missing');
  const orgId = getBufferOrganizationId();
  const tz = getSchedulerTimezone();
  const today = localDateInTimezone(new Date(), tz);
  const end = addDaysToLocalDate(today, 30);
  const dueAtStart = `${today}T00:00:00${timezoneOffsetForDate(today, tz)}`;
  const dueAtEnd = `${end}T23:59:59${timezoneOffsetForDate(end, tz)}`;

  const posts = await listScheduledBufferPosts(apiKey, orgId, { dueAtStart, dueAtEnd });
  const { posts: feedPosts } = await loadAllFeedPosts();
  console.log(`Scanned ${posts.length} scheduled posts (${today} → ${end})`);

  const probeCache = new Map<string, boolean>();
  async function imageNeedsRepair(url: string | undefined): Promise<boolean> {
    if (!url) return true;
    if (isDeadScreenshotUrl(url)) return true;
    if (probeCache.has(url)) return !probeCache.get(url)!;
    const probe = await probeBufferImageUrl(url);
    probeCache.set(url, probe.ok);
    return !probe.ok;
  }

  const toFix: BufferScheduledPostSummary[] = [];
  for (const post of posts) {
    if (await imageNeedsRepair(post.imageUrl)) toFix.push(post);
  }

  console.log(`Need repair: ${toFix.length}`);
  for (const p of toFix.slice(0, 25)) {
    const match = findFeedPost(p, feedPosts);
    console.log(
      JSON.stringify({
        id: p.id,
        dueAt: p.dueAt,
        service: p.channelService,
        imageUrl: p.imageUrl,
        matched: match?.slug ?? null,
        text: p.text.slice(0, 50),
      }),
    );
  }

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to delete+recreate.');
    return;
  }

  let ok = 0;
  let failed = 0;
  let skipped = 0;

  for (const post of toFix) {
    const dueAt = post.dueAt;
    if (!dueAt || new Date(dueAt).getTime() <= Date.now() + 60_000) {
      console.warn(`Skip ${post.id} — dueAt missing or too soon`);
      skipped += 1;
      continue;
    }

    const service = post.channelService as BufferChannelService;
    if (!['twitter', 'linkedin', 'googlebusiness', 'facebook'].includes(service)) {
      console.warn(`Skip ${post.id} — unsupported service ${post.channelService}`);
      skipped += 1;
      continue;
    }

    const feedPost = findFeedPost(post, feedPosts);
    const articleUrl =
      feedPost?.url || extractArticleUrlFromText(post.text) || 'https://custodynote.com/';
    const feedId = feedPost?.feedId || parseFeedFromArticleUrl(articleUrl) || 'custodynote';
    const imageUrl =
      (service === 'googlebusiness' ? feedPost?.googleBusinessImageUrl : undefined) ||
      feedPost?.imageUrl ||
      FEED_DEFAULT_IMAGES[feedId] ||
      FEED_DEFAULT_IMAGES.custodynote;
    const text = feedPost ? buildSchedulablePostTextForService(feedPost, service) : post.text;

    try {
      // Create first, then delete old — avoids orphaning on rate-limit mid-repair.
      const created = await withRateLimitRetry(
        () =>
          createScheduledBufferPost(apiKey, {
            channelId: post.channelId,
            channelService: service,
            text,
            dueAt,
            url: articleUrl,
            imageUrl,
            imageAlt: feedPost?.imageAlt ?? post.text.split('\n')[0] ?? 'Blog post',
            feedId,
          }),
        `create ${post.id}`,
      );
      await sleep(3000);
      await withRateLimitRetry(() => deleteBufferPost(apiKey, post.id), `delete ${post.id}`);
      ok += 1;
      console.log(`Repaired ${post.id} → ${created.id} (${service}, ${feedId})`);
      await sleep(5000);
    } catch (err) {
      failed += 1;
      console.error(`Failed ${post.id}:`, err instanceof Error ? err.message : err);
      await sleep(20_000);
    }
  }

  console.log(JSON.stringify({ ok, failed, skipped, scanned: posts.length, candidates: toFix.length }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
