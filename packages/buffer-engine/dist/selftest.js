"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSiteBufferSelfTest = runSiteBufferSelfTest;
const client_1 = require("./client");
const config_1 = require("./config");
const scheduler_core_1 = require("./scheduler-core");
const metrics_1 = require("./metrics");
const storage_1 = require("./storage");
async function runSiteBufferSelfTest(adapter, options) {
    const env = (0, config_1.getSiteBufferEnvConfig)();
    const now = options?.now ?? new Date();
    const yesterday = (0, scheduler_core_1.addDaysToLocalDate)((0, scheduler_core_1.localDateInTimezone)(now, env.timezone), -1);
    const issues = [];
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
    const hostname = (0, metrics_1.siteHostnameFromUrl)(adapter.siteUrl);
    const today = (0, scheduler_core_1.localDateInTimezone)(now, env.timezone);
    const yesterdayOffset = (0, scheduler_core_1.timezoneOffsetForDate)(yesterday, env.timezone);
    const todayOffset = (0, scheduler_core_1.timezoneOffsetForDate)(today, env.timezone);
    const dayStart = `${yesterday}T00:00:00${yesterdayOffset}`;
    const dayEnd = `${today}T00:00:00${todayOffset}`;
    const listOpts = {
        status: ['sent'],
        dueAtStart: dayStart,
        dueAtEnd: dayEnd,
        channelIds: env.channels.map((c) => c.id),
    };
    let sent;
    let metricsAvailable = true;
    try {
        sent = await (0, client_1.listPostsInWindow)(env.apiKey, env.organizationId, {
            ...listOpts,
            includeMetrics: true,
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // API keys without insights:read still need a sent-count workspace check.
        if (/insights:read/i.test(message)) {
            metricsAvailable = false;
            issues.push('Buffer API key lacks insights:read — sent-count check only (no metrics ingest)');
            sent = await (0, client_1.listPostsInWindow)(env.apiKey, env.organizationId, {
                ...listOpts,
                includeMetrics: false,
            });
        }
        else {
            throw err;
        }
    }
    const siteSent = sent.filter((p) => p.text.includes(hostname));
    const sentCount = siteSent.length;
    if (sentCount < config_1.MIN_POSTS_PER_DAY) {
        issues.push(`Yesterday (${yesterday}): only ${sentCount}/${env.postsPerDay} posts sent`);
    }
    let metricsIngested = 0;
    if (metricsAvailable) {
        const ingested = (0, metrics_1.ingestMetricsFromPosts)(siteSent, hostname);
        metricsIngested = ingested.length;
        const kv = adapter.kv ?? null;
        const existing = await (0, storage_1.getSlugEngagementStats)(kv, adapter.siteId);
        await (0, storage_1.saveSlugEngagementStats)(kv, adapter.siteId, (0, storage_1.mergeSlugStats)(existing, ingested));
    }
    return {
        ok: sentCount >= config_1.MIN_POSTS_PER_DAY,
        date: yesterday,
        sentCount,
        requiredCount: env.postsPerDay,
        metricsIngested,
        issues,
    };
}
