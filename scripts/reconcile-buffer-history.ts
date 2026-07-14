#!/usr/bin/env npx tsx
/**
 * Historical Buffer reconciliation (dry-run by default).
 *
 * Usage:
 *   npm run buffer:reconcile-history
 *   npm run buffer:reconcile-history -- --days=14
 *   npm run buffer:reconcile-history -- --apply   # only status repairs — never auto-publish stale content
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { listScheduledBufferPosts, fetchBufferPostStatusMap } from '../lib/buffer/client';
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
  getSchedulerTimezone,
} from '../lib/buffer/config';
import { addDaysToLocalDate, localDateInTimezone } from '../lib/buffer/scheduler-core';
import { getSchedulerRunForDate } from '../lib/buffer/scheduler-storage';
import { classifyBufferError } from '../lib/buffer/errors';

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
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

type Category =
  | 'confirmed_scheduled_or_sent'
  | 'kv_missing_buffer_id'
  | 'buffer_id_not_found'
  | 'under_quota'
  | 'safe_to_retry'
  | 'requires_attachment_repair'
  | 'requires_human_review'
  | 'stale_past_due_review'
  | 'ok';

interface Finding {
  date: string;
  category: Category;
  detail: string;
  postIds?: string[];
  proposedAction: string;
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const apply = process.argv.includes('--apply');
  const daysArg = process.argv.find((a) => a.startsWith('--days='));
  const days = daysArg ? Math.max(1, Number(daysArg.split('=')[1]) || 7) : 7;

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const timezone = getSchedulerTimezone();
  const today = localDateInTimezone(new Date(), timezone);
  const channels = getBufferChannels();
  const orgId = getBufferOrganizationId();
  const findings: Finding[] = [];

  const end = new Date();
  end.setUTCDate(end.getUTCDate() + 1);
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);

  let queued: Awaited<ReturnType<typeof listScheduledBufferPosts>> = [];
  try {
    queued = await listScheduledBufferPosts(apiKey, orgId, {
      dueAtStart: start.toISOString(),
      dueAtEnd: end.toISOString(),
      channelIds: channels.map((c) => c.id),
    });
  } catch (err) {
    const classified = classifyBufferError(err);
    console.error('Failed to list Buffer posts:', classified.message);
    process.exit(1);
  }

  for (let i = 0; i < days; i++) {
    const date = addDaysToLocalDate(today, -i);
    const run = await getSchedulerRunForDate(date);
    const dayPosts = queued.filter((p) => (p.dueAt ?? '').slice(0, 10) === date || dateFromDueAtLondon(p.dueAt, timezone) === date);

    if (!run) {
      if (dayPosts.length === 0 && i > 0) {
        findings.push({
          date,
          category: 'under_quota',
          detail: 'No KV run and no Buffer posts found for this date',
          proposedAction: 'review_required — do not auto-republish stale day',
        });
      }
      continue;
    }

    const emptyIds = run.postIds.filter((id) => !id || id === 'dry-run' || id === 'already-scheduled-in-buffer');
    if (emptyIds.length > 0) {
      findings.push({
        date,
        category: 'kv_missing_buffer_id',
        detail: `${emptyIds.length} KV postIds are empty or sentinel`,
        proposedAction: apply ? 'Strip sentinel IDs from diagnostics only — no auto-resend' : 'Dry-run only',
      });
    }

    const realIds = run.postIds.filter((id) => id && !['dry-run', 'already-scheduled-in-buffer'].includes(id));
    if (realIds.length > 0) {
      const statusMap = await fetchBufferPostStatusMap(apiKey, orgId, realIds);
      const missing = realIds.filter((id) => !statusMap.has(id));
      if (missing.length > 0) {
        findings.push({
          date,
          category: 'buffer_id_not_found',
          detail: `${missing.length} KV postIds not found in Buffer`,
          postIds: missing,
          proposedAction: 'requires_human_review — possible deletion or wrong org',
        });
      } else {
        findings.push({
          date,
          category: 'confirmed_scheduled_or_sent',
          detail: `${realIds.length} posts present in Buffer (KV aligned)`,
          proposedAction: 'none',
        });
      }
    }

    const required = run.postIds.length;
    if (dayPosts.length < required && required > 0) {
      findings.push({
        date,
        category: 'under_quota',
        detail: `Buffer day window has ${dayPosts.length} posts; KV expected ${required}`,
        proposedAction: date < today ? 'stale_past_due_review' : 'safe_to_retry via buffer:verify gap-fill',
      });
    }
  }

  // Attachment hint from remaining failed rows in seo-growth results (if present)
  const seoPath = resolve(process.cwd(), 'seo-growth/buffer/buffer-scheduled-results.json');
  if (existsSync(seoPath)) {
    const seo = JSON.parse(readFileSync(seoPath, 'utf8')) as {
      results?: Array<{ ok: boolean; error?: string; slug?: string }>;
    };
    const failed = (seo.results ?? []).filter((r) => !r.ok);
    for (const row of failed) {
      const msg = row.error ?? '';
      findings.push({
        date: 'seo-growth',
        category: /image|webp|gbp|attachment|jpeg/i.test(msg)
          ? 'requires_attachment_repair'
          : /too many requests/i.test(msg)
            ? 'safe_to_retry'
            : 'requires_human_review',
        detail: `${row.slug ?? 'unknown'}: ${msg.slice(0, 120)}`,
        proposedAction: 'npm run buffer:retry-failed (slow) or attachment repair',
      });
    }
  }

  const byCategory = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.category] = (acc[f.category] ?? 0) + 1;
    return acc;
  }, {});

  const report = {
    ok: true,
    dryRun: !apply,
    daysExamined: days,
    today,
    examined: findings.length,
    byCategory,
    findings,
    note: apply
      ? 'Apply mode does not auto-publish stale content; only records this report.'
      : 'Dry-run only — no writes to Buffer or KV post schedules.',
    capturedAt: new Date().toISOString(),
  };

  const outDir = resolve(process.cwd(), 'seo-growth/buffer');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'buffer-reconciliation-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, findings: `${findings.length} findings`, outPath }, null, 2));
}

function dateFromDueAtLondon(dueAt: string | null, timezone: string): string | null {
  if (!dueAt) return null;
  try {
    return localDateInTimezone(new Date(dueAt), timezone);
  } catch {
    return dueAt.slice(0, 10);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
