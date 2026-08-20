"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySiteBufferSchedule = verifySiteBufferSchedule;
const config_1 = require("./config");
const scheduler_core_1 = require("./scheduler-core");
const reconcile_1 = require("./reconcile");
const scheduler_1 = require("./scheduler");
async function verifySiteBufferSchedule(adapter, options) {
    const env = (0, config_1.getSiteBufferEnvConfig)();
    const now = options?.now ?? new Date();
    const localDate = (0, scheduler_core_1.localDateInTimezone)(now, env.timezone);
    const issues = [];
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
    const before = await (0, reconcile_1.countSitePostsInBufferForDay)(env.apiKey, env.organizationId, adapter.siteUrl, localDate, env.timezone, channelIds);
    let scheduledCount = before.count;
    let gapFilled = 0;
    if (scheduledCount < env.postsPerDay) {
        issues.push(`Only ${scheduledCount}/${env.postsPerDay} posts scheduled for ${localDate}`);
        if (options?.gapFill !== false) {
            const needed = env.postsPerDay - scheduledCount;
            const result = await (0, scheduler_1.runSiteBufferScheduler)(adapter, {
                now,
                force: true,
                respectCurrentTime: true,
                limit: needed,
            });
            if (!result.ok && result.reason)
                issues.push(`Gap-fill: ${result.reason}`);
            // Authoritative re-count — never trust posts.length (idempotent skips look like creates).
            const after = await (0, reconcile_1.countSitePostsInBufferForDay)(env.apiKey, env.organizationId, adapter.siteUrl, localDate, env.timezone, channelIds);
            gapFilled = Math.max(0, after.count - scheduledCount);
            scheduledCount = after.count;
            if (scheduledCount < env.postsPerDay && gapFilled === 0 && result.posts?.length) {
                issues.push(`Gap-fill reported ${result.posts.length} post(s) but Buffer still at ${scheduledCount}/${env.postsPerDay} (likely idempotent re-count of existing)`);
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
