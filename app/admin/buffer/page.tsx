import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { BufferDiagnosticsPanel } from '@/components/admin/BufferDiagnosticsPanel';
import { getCronRunLog } from '@/lib/cron-run-log';
import { getSchedulerTimezone } from '@/lib/buffer/config';
import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { getSchedulerRunForDate, BUFFER_SCHEDULER_SITE_ID } from '@/lib/buffer/scheduler-storage';
import { listBufferAttempts, summariseAttempts } from '@/lib/buffer/attempts';
import { getBufferApiKey } from '@/lib/buffer/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BUFFER_JOBS = [
  'buffer-blog-posts',
  'buffer-verify',
  'buffer-selftest',
  'buffer-daily-report',
  'buffer-cross-site-report',
  'buffer-health',
  'buffer-weekly-report',
] as const;

export default async function AdminBufferPage() {
  const timezone = getSchedulerTimezone();
  const today = localDateInTimezone(new Date(), timezone);
  const run = await getSchedulerRunForDate(today);
  const attempts = await listBufferAttempts(BUFFER_SCHEDULER_SITE_ID, today);
  const expected = run?.postIds.length ?? 0;
  const summary = summariseAttempts(BUFFER_SCHEDULER_SITE_ID, today, attempts, expected || 5);

  const cronLogs = Object.fromEntries(
    await Promise.all(
      BUFFER_JOBS.map(async (job) => [job, await getCronRunLog(job)] as const),
    ),
  );

  const hasApiKey = Boolean(getBufferApiKey());

  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="buffer"
          adminEmail={email}
          title="Buffer social diagnostics"
          description="Scheduler health, today's run record, attempt summary, and recent cron outcomes. No secrets are shown."
        >
          <BufferDiagnosticsPanel
            today={today}
            timezone={timezone}
            hasApiKey={hasApiKey}
            run={run}
            summary={summary}
            attempts={attempts.slice(-20).reverse()}
            cronLogs={cronLogs}
          />
        </AdminShell>
      )}
    </AdminGate>
  );
}
