'use client';

import type { BufferAttemptRecord, BufferBatchSummary } from '@/lib/buffer/attempts';
import type { CronRunLogEntry } from '@/lib/cron-run-log';
import type { SchedulerRunRecord } from '@/lib/buffer/scheduler-storage';

export function BufferDiagnosticsPanel({
  today,
  timezone,
  hasApiKey,
  run,
  summary,
  attempts,
  cronLogs,
}: {
  today: string;
  timezone: string;
  hasApiKey: boolean;
  run: SchedulerRunRecord | null;
  summary: BufferBatchSummary;
  attempts: BufferAttemptRecord[];
  cronLogs: Record<string, CronRunLogEntry | null>;
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today (London)" value={today} hint={timezone} />
        <Stat label="API key configured" value={hasApiKey ? 'Yes' : 'No'} />
        <Stat
          label="KV posts today"
          value={String(run?.postIds.length ?? 0)}
          hint={run ? `Scheduled at ${run.scheduledAt}` : 'No run record'}
        />
        <Stat
          label="Batch complete"
          value={summary.complete ? 'Yes' : 'No'}
          hint={`${summary.accepted}/${summary.expected || '—'} accepted`}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--navy)]">Attempt summary (today)</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-sm">
          <Metric k="Expected" v={summary.expected} />
          <Metric k="Attempted" v={summary.attempted} />
          <Metric k="Accepted" v={summary.accepted} />
          <Metric k="Failed" v={summary.failed} />
          <Metric k="Duplicates" v={summary.duplicates} />
          <Metric k="Rate limited" v={summary.rateLimited} />
        </dl>
        {attempts.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No durable attempt records yet for today (attempts are logged when the enhanced
            attempt pipeline is active).
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {attempts.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2">
                <span className="font-mono text-xs text-slate-500">{a.createdAt.slice(11, 19)}</span>
                <span className="font-medium">{a.slug}</span>
                <span>{a.channelService}</span>
                <span className={a.outcome === 'accepted' ? 'text-emerald-700' : 'text-amber-700'}>
                  {a.outcome}
                </span>
                {a.errorCode ? <span className="text-slate-500">{a.errorCode}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--navy)]">Cron heartbeats</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {Object.entries(cronLogs).map(([job, log]) => (
            <li key={job} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-50 py-2">
              <span className="font-mono text-xs">{job}</span>
              {log ? (
                <span>
                  <span
                    className={
                      log.outcome === 'success'
                        ? 'text-emerald-700'
                        : log.outcome === 'skipped'
                          ? 'text-slate-600'
                          : 'text-red-700'
                    }
                  >
                    {log.outcome}
                  </span>
                  {' · '}
                  {log.finishedAt}
                  {log.errorMessage ? ` · ${log.errorMessage.slice(0, 80)}` : ''}
                </span>
              ) : (
                <span className="text-[var(--muted)]">No recent run logged</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-[var(--muted)]">
        <h2 className="text-lg font-semibold text-[var(--navy)]">Safe ops</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Dry-run schedule: <code className="text-xs">npm run buffer:schedule -- --dry-run</code>
          </li>
          <li>
            Reconcile history:{' '}
            <code className="text-xs">npm run buffer:reconcile-history</code>
          </li>
          <li>
            GBP image check: <code className="text-xs">npm run buffer:verify-scheduled-gbp</code>
          </li>
          <li>Do not force-republish stale past-due content without review.</li>
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--navy)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

function Metric({ k, v }: { k: string; v: number }) {
  return (
    <div>
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-lg font-semibold text-[var(--navy)]">{v}</dd>
    </div>
  );
}
