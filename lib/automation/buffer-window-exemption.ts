import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import { classifyError } from './errors';

/** Jobs whose “missed window” can be suppressed from Buffer schedule truth / 429s. */
export const BUFFER_WINDOW_EXEMPT_JOBS = [
  'buffer-blog-posts',
  'buffer-verify',
  'buffer-daily-report',
] as const;

export type BufferWindowExemptJob = (typeof BUFFER_WINDOW_EXEMPT_JOBS)[number];

export function isBufferWindowExemptJob(jobName: string): jobName is BufferWindowExemptJob {
  return (BUFFER_WINDOW_EXEMPT_JOBS as readonly string[]).includes(jobName);
}

export interface BufferWindowExemption {
  suppress: boolean;
  reason?:
    | 'buffer_quota_met'
    | 'buffer_posts_already_exist'
    | 'buffer_inspect_transient';
  scheduledCount?: number;
  requiredCount?: number;
  errorMessage?: string;
}

export type BufferScheduleInspect = Awaited<ReturnType<typeof verifyRepukBufferSchedule>>;

/**
 * Shared Buffer inspect for healthcheck/watchdog — call once per run and reuse.
 * Never throws: rate limits / network become { kind: 'transient' }.
 */
export async function inspectBufferScheduleSafe(options?: {
  now?: Date;
  inspectFn?: typeof verifyRepukBufferSchedule;
}): Promise<
  | { kind: 'ok'; result: BufferScheduleInspect }
  | { kind: 'transient'; message: string }
  | { kind: 'error'; message: string }
> {
  const inspectFn = options?.inspectFn ?? verifyRepukBufferSchedule;
  try {
    const result = await inspectFn({ now: options?.now, gapFill: false });
    return { kind: 'ok', result };
  } catch (err) {
    const classified = classifyError(err);
    const message = classified.message;
    if (classified.category === 'rate_limit' || classified.category === 'network') {
      return { kind: 'transient', message };
    }
    return { kind: 'error', message };
  }
}

/**
 * Whether a missing cron-run-log / lastSuccessfulAt should be treated as a
 * false “missed window” rather than a real scheduler miss.
 *
 * - Quota met → suppress (job work already present in Buffer)
 * - Any posts already scheduled today → suppress for schedule/verify jobs
 *   (partial run still happened; under-quota is handled elsewhere)
 * - Inspect 429 / transient network → suppress (do not page as overdue)
 */
export function evaluateBufferWindowExemption(
  jobName: string,
  inspect:
    | { kind: 'ok'; result: BufferScheduleInspect }
    | { kind: 'transient'; message: string }
    | { kind: 'error'; message: string }
    | null,
): BufferWindowExemption {
  if (!isBufferWindowExemptJob(jobName)) {
    return { suppress: false };
  }

  if (!inspect) {
    return { suppress: false };
  }

  if (inspect.kind === 'transient') {
    return {
      suppress: true,
      reason: 'buffer_inspect_transient',
      errorMessage: inspect.message,
    };
  }

  if (inspect.kind === 'error') {
    return { suppress: false, errorMessage: inspect.message };
  }

  const { scheduledCount, requiredCount, ok } = inspect.result;
  if (
    ok &&
    typeof scheduledCount === 'number' &&
    typeof requiredCount === 'number' &&
    scheduledCount >= requiredCount
  ) {
    return {
      suppress: true,
      reason: 'buffer_quota_met',
      scheduledCount,
      requiredCount,
    };
  }

  // Partial schedule proves the morning job ran (or gap-fill landed something).
  // Do not also fire “missed expected run window” — under-quota is a separate signal.
  if (
    typeof scheduledCount === 'number' &&
    scheduledCount > 0 &&
    (jobName === 'buffer-blog-posts' || jobName === 'buffer-verify' || jobName === 'buffer-daily-report')
  ) {
    return {
      suppress: true,
      reason: 'buffer_posts_already_exist',
      scheduledCount,
      requiredCount,
    };
  }

  return {
    suppress: false,
    scheduledCount,
    requiredCount,
  };
}
