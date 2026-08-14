import { describe, expect, it, vi } from 'vitest';
import {
  isPastBufferOverdueGate,
  parseDailyUtcCron,
  scheduledRunUtcForLocalDate,
} from '@/lib/automation/overdue-gate';
import { localDateInTimezone } from '@/lib/buffer/scheduler-core';

const JOB = {
  expectedSchedule: '5 5 * * *',
  maxToleratedDelayMinutes: 45,
} as const;

describe('buffer overdue gate', () => {
  it('parses daily UTC cron schedules', () => {
    expect(parseDailyUtcCron('5 5 * * *')).toEqual({ minute: 5, hourUtc: 5 });
    expect(parseDailyUtcCron('35 5 * * *')).toEqual({ minute: 35, hourUtc: 5 });
    expect(parseDailyUtcCron('bad')).toBeNull();
  });

  it('maps local date to UTC cron instant', () => {
    expect(scheduledRunUtcForLocalDate('2026-07-21', 5, 5).toISOString()).toBe(
      '2026-07-21T05:05:00.000Z',
    );
  });

  it('keeps gate closed at London midnight watchdog (false-positive fixture)', () => {
    // 2026-07-20 23:20 UTC = 00:20 BST Jul 21 — alert that fired overnight
    const now = new Date('2026-07-20T23:20:00.000Z');
    expect(localDateInTimezone(now, 'Europe/London')).toBe('2026-07-21');
    expect(
      isPastBufferOverdueGate(now, { timezone: 'Europe/London', job: JOB }),
    ).toBe(false);
  });

  it('opens gate after schedule + grace (05:05 UTC + 45m = 05:50 UTC)', () => {
    expect(
      isPastBufferOverdueGate(new Date('2026-07-21T05:49:00.000Z'), {
        timezone: 'Europe/London',
        job: JOB,
      }),
    ).toBe(false);
    expect(
      isPastBufferOverdueGate(new Date('2026-07-21T05:50:00.000Z'), {
        timezone: 'Europe/London',
        job: JOB,
      }),
    ).toBe(true);
  });

  it('is open at 07:00 UTC mid-morning when quota would be checked', () => {
    expect(
      isPastBufferOverdueGate(new Date('2026-07-21T07:00:00.000Z'), {
        timezone: 'Europe/London',
        job: JOB,
      }),
    ).toBe(true);
  });

  it('stays closed through winter morning before grace', () => {
    const before = new Date('2026-01-15T05:30:00.000Z');
    expect(localDateInTimezone(before, 'Europe/London')).toBe('2026-01-15');
    expect(
      isPastBufferOverdueGate(before, { timezone: 'Europe/London', job: JOB }),
    ).toBe(false);
    expect(
      isPastBufferOverdueGate(new Date('2026-01-15T05:50:00.000Z'), {
        timezone: 'Europe/London',
        job: JOB,
      }),
    ).toBe(true);
  });
});

describe('watchdog uses overdue gate for overnight skip', () => {
  it('does not mark buffer-blog-posts overdue before schedule+grace', async () => {
    vi.resetModules();
    vi.doMock('@/lib/automation/config', () => ({
      getAutomationConfig: () => ({
        enabled: true,
        watchdogEnabled: true,
        dryRun: true,
        autoRepairEnabled: false,
        stuckJobTimeoutMinutes: 120,
      }),
    }));
    vi.doMock('@/lib/automation/env-guard', () => ({
      canPerformLiveSideEffects: () => false,
    }));
    vi.doMock('@/lib/automation/buffer-probe', () => ({
      probeBufferCredentials: async () => ({ issues: [] }),
    }));
    vi.doMock('@/lib/automation/lock', () => ({
      acquireJobLock: async () => true,
      releaseJobLock: async () => {},
      getJobLock: async () => null,
      clearExpiredJobLock: async () => false,
    }));
    vi.doMock('@/lib/automation/execution-log', () => ({
      createExecutionId: () => 'test-exec',
      startExecution: () => ({ id: 'test-exec' }),
      saveExecution: async () => {},
      completeExecution: async () => {},
    }));
    vi.doMock('@/lib/automation/job-registry', () => ({
      getJobState: async () => null,
      markJobHealthChecked: async () => {},
      recordJobAttempt: async () => ({}),
      getJobDefinition: () => JOB,
    }));
    vi.doMock('@/lib/cron-run-log', () => ({
      getCronRunLog: async () => null,
    }));
    vi.doMock('@/lib/buffer/engine-run', () => ({
      verifyRepukBufferSchedule: async () => ({
        ok: false,
        scheduledCount: 1,
        requiredCount: 5,
      }),
    }));
    vi.doMock('@/lib/automation/notifications', () => ({
      buildIncidentFingerprint: () => 'fp',
      notifyIncident: async () => ({ sent: false, suppressed: false }),
    }));
    vi.doMock('@/lib/automation/observability', () => ({
      logAutomationEvent: () => {},
    }));
    vi.doMock('@/lib/buffer/config', () => ({
      getSchedulerTimezone: () => 'Europe/London',
    }));

    const { runAutomationWatchdog } = await import('@/lib/automation/watchdog');
    const result = await runAutomationWatchdog({
      dryRun: true,
      skipLock: true,
      now: new Date('2026-07-20T23:20:00.000Z'),
    });

    expect(result.overdueJobs).toEqual([]);
    expect(result.notes.some((n) => n.includes('before schedule+grace'))).toBe(true);
  });

  it('suppresses overdue when past gate but Buffer quota already met', async () => {
    vi.resetModules();
    vi.doMock('@/lib/automation/config', () => ({
      getAutomationConfig: () => ({
        enabled: true,
        watchdogEnabled: true,
        dryRun: true,
        autoRepairEnabled: false,
        stuckJobTimeoutMinutes: 120,
      }),
    }));
    vi.doMock('@/lib/automation/env-guard', () => ({
      canPerformLiveSideEffects: () => false,
    }));
    vi.doMock('@/lib/automation/buffer-probe', () => ({
      probeBufferCredentials: async () => ({ issues: [] }),
    }));
    vi.doMock('@/lib/automation/lock', () => ({
      acquireJobLock: async () => true,
      releaseJobLock: async () => {},
      getJobLock: async () => null,
      clearExpiredJobLock: async () => false,
    }));
    vi.doMock('@/lib/automation/execution-log', () => ({
      createExecutionId: () => 'test-exec-quota',
      startExecution: () => ({ id: 'test-exec-quota' }),
      saveExecution: async () => {},
      completeExecution: async () => {},
    }));
    vi.doMock('@/lib/automation/job-registry', () => ({
      getJobState: async () => null,
      markJobHealthChecked: async () => {},
      recordJobAttempt: async () => ({}),
      getJobDefinition: () => JOB,
    }));
    vi.doMock('@/lib/cron-run-log', () => ({
      getCronRunLog: async () => null,
    }));
    vi.doMock('@/lib/buffer/engine-run', () => ({
      verifyRepukBufferSchedule: async () => ({
        ok: true,
        scheduledCount: 5,
        requiredCount: 5,
      }),
    }));
    vi.doMock('@/lib/automation/notifications', () => ({
      buildIncidentFingerprint: () => 'fp',
      notifyIncident: async () => ({ sent: false, suppressed: false }),
    }));
    vi.doMock('@/lib/automation/observability', () => ({
      logAutomationEvent: () => {},
    }));
    vi.doMock('@/lib/buffer/config', () => ({
      getSchedulerTimezone: () => 'Europe/London',
    }));

    const { runAutomationWatchdog } = await import('@/lib/automation/watchdog');
    const result = await runAutomationWatchdog({
      dryRun: true,
      skipLock: true,
      now: new Date('2026-07-21T07:00:00.000Z'),
    });

    expect(result.overdueJobs).toEqual([]);
    expect(result.notes.some((n) => n.includes('quota already met'))).toBe(true);
  });
});
