import { listPostsInWindow } from './client';
import { getSiteBufferEnvConfig, MIN_POSTS_PER_DAY } from './config';
import { localDateInTimezone, addDaysToLocalDate, timezoneOffsetForDate } from './scheduler-core';
import type { BufferEngineAdapter, SelfTestResult } from './types';
import { ingestMetricsFromPosts, siteHostnameFromUrl } from './metrics';
import { getSlugEngagementStats, mergeSlugStats, saveSlugEngagementStats } from './storage';

export async function runSiteBufferSelfTest(
  adapter: BufferEngineAdapter,
  options?: { now?: Date },
): Promise<SelfTestResult> {
  const env = getSiteBufferEnvConfig();
  const now = options?.now ?? new Date();
  const yesterday = addDaysToLocalDate(localDateInTimezone(now, env.timezone), -1);
  const issues: string[] = [];

  if (!env.apiKey) {
    return {
      ok: false,
      date: yesterday,
      sentCount: 0,
      requiredCount: env.postsPerDay,
      metricsIngested: 0,
      issues: ['BUFFER_API_KEY missing'],
    };
  }

  const hostname = siteHostnameFromUrl(adapter.siteUrl);
  const today = localDateInTimezone(now, env.timezone);
  const yesterdayOffset = timezoneOffsetForDate(yesterday, env.timezone);
  const todayOffset = timezoneOffsetForDate(today, env.timezone);
  const dayStart = `${yesterday}T00:00:00${yesterdayOffset}`;
  const dayEnd = `${today}T00:00:00${todayOffset}`;

  const listOpts = {
    status: ['sent'] as Array<'sent'>,
    dueAtStart: dayStart,
    dueAtEnd: dayEnd,
    channelIds: env.channels.map((c) => c.id),
  };

  let sent;
  let metricsAvailable = true;
  try {
    sent = await listPostsInWindow(env.apiKey, env.organizationId, {
      ...listOpts,
      includeMetrics: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // API keys without insights:read still need a sent-count workspace check.
    if (/insights:read/i.test(message)) {
      metricsAvailable = false;
      issues.push('Buffer API key lacks insights:read — sent-count check only (no metrics ingest)');
      sent = await listPostsInWindow(env.apiKey, env.organizationId, {
        ...listOpts,
        includeMetrics: false,
      });
    } else {
      throw err;
    }
  }

  const siteSent = sent.filter((p) => p.text.includes(hostname));
  const sentCount = siteSent.length;

  if (sentCount < MIN_POSTS_PER_DAY) {
    issues.push(`Yesterday (${yesterday}): only ${sentCount}/${env.postsPerDay} posts sent`);
  }

  let metricsIngested = 0;
  if (metricsAvailable) {
    const ingested = ingestMetricsFromPosts(siteSent, hostname);
    metricsIngested = ingested.length;
    const kv = adapter.kv ?? null;
    const existing = await getSlugEngagementStats(kv, adapter.siteId);
    await saveSlugEngagementStats(kv, adapter.siteId, mergeSlugStats(existing, ingested));
  }

  return {
    ok: sentCount >= MIN_POSTS_PER_DAY,
    date: yesterday,
    sentCount,
    requiredCount: env.postsPerDay,
    metricsIngested,
    issues,
  };
}
