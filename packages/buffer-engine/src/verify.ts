import { getSiteBufferEnvConfig } from './config';
import { localDateInTimezone } from './scheduler-core';
import { countSitePostsInBufferForDay } from './reconcile';
import type { BufferEngineAdapter, VerifyResult } from './types';
import { runSiteBufferScheduler } from './scheduler';

export async function verifySiteBufferSchedule(
  adapter: BufferEngineAdapter,
  options?: { now?: Date; gapFill?: boolean },
): Promise<VerifyResult> {
  const env = getSiteBufferEnvConfig();
  const now = options?.now ?? new Date();
  const localDate = localDateInTimezone(now, env.timezone);
  const issues: string[] = [];

  if (!env.apiKey) {
    return {
      ok: false,
      date: localDate,
      scheduledCount: 0,
      requiredCount: env.postsPerDay,
      gapFilled: 0,
      issues: ['BUFFER_API_KEY missing'],
    };
  }

  const channelIds = env.channels.map((c) => c.id);
  const before = await countSitePostsInBufferForDay(
    env.apiKey,
    env.organizationId,
    adapter.siteUrl,
    localDate,
    env.timezone,
    channelIds,
  );

  let scheduledCount = before.count;
  let gapFilled = 0;

  if (scheduledCount < env.postsPerDay) {
    issues.push(`Only ${scheduledCount}/${env.postsPerDay} posts scheduled for ${localDate}`);
    if (options?.gapFill !== false) {
      const needed = env.postsPerDay - scheduledCount;
      const result = await runSiteBufferScheduler(adapter, {
        now,
        force: true,
        respectCurrentTime: true,
        limit: needed,
      });
      if (!result.ok && result.reason) issues.push(`Gap-fill: ${result.reason}`);

      // Authoritative re-count — never trust posts.length (idempotent skips look like creates).
      const after = await countSitePostsInBufferForDay(
        env.apiKey,
        env.organizationId,
        adapter.siteUrl,
        localDate,
        env.timezone,
        channelIds,
      );
      gapFilled = Math.max(0, after.count - scheduledCount);
      scheduledCount = after.count;
      if (scheduledCount < env.postsPerDay && gapFilled === 0 && result.posts?.length) {
        issues.push(
          `Gap-fill reported ${result.posts.length} post(s) but Buffer still at ${scheduledCount}/${env.postsPerDay} (likely idempotent re-count of existing)`,
        );
      }
    }
  }

  return {
    ok: scheduledCount >= env.postsPerDay,
    date: localDate,
    scheduledCount,
    requiredCount: env.postsPerDay,
    gapFilled,
    issues,
  };
}
