import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, unknown>();

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: async (key: string, value: unknown, opts?: { nx?: boolean }) => {
      if (opts?.nx && store.has(key)) return null;
      store.set(key, value);
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    sadd: async () => 1,
    smembers: async () => [],
    expire: async () => 1,
    incr: async () => 1,
  }),
}));

vi.mock('@/lib/automation/config', () => ({
  getAutomationConfig: () => ({
    enabled: true,
    dryRun: false,
    autoRetryEnabled: true,
    maxRetryCount: 2,
  }),
  getDeploymentId: () => 'test-deploy',
  getRuntimeEnvironment: () => 'test',
}));

vi.mock('@/lib/automation/observability', () => ({
  logAutomationEvent: () => {},
}));

import { withAutomationJob } from '@/lib/automation/with-job';
import { getCronRunLog } from '@/lib/cron-run-log';

describe('withAutomationJob cron-run-log', () => {
  beforeEach(() => {
    store.clear();
    vi.stubEnv('AUTOMATION_ENABLED', 'true');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('persists success and partial outcomes to cron-run-log / lastSuccessfulAt path', async () => {
    const success = await withAutomationJob({
      jobName: 'buffer-verify',
      triggerSource: 'cron',
      skipLock: true,
      run: async () => ({
        status: 'successful',
        result: { ok: true },
        counts: { quotaAchieved: 5 },
      }),
    });
    expect(success.ok).toBe(true);
    const successLog = await getCronRunLog('buffer-verify');
    expect(successLog?.outcome).toBe('success');
    expect(successLog?.jobName).toBe('buffer-verify');

    const partial = await withAutomationJob({
      jobName: 'buffer-blog-posts',
      triggerSource: 'cron',
      skipLock: true,
      run: async () => ({
        status: 'partially_successful',
        result: { ok: false, posts: [{ postId: '1' }, { postId: '2' }] },
        counts: { quotaAchieved: 2 },
        errorMessage: 'Scheduled 2/5',
      }),
    });
    expect(partial.ok).toBe(true);
    const partialLog = await getCronRunLog('buffer-blog-posts');
    expect(partialLog?.outcome).toBe('partial');
    expect(partialLog?.counts?.quotaAchieved).toBe(2);
  });
});
