import { describe, expect, it } from 'vitest';
import {
  evaluateBufferWindowExemption,
  isBufferWindowExemptJob,
} from '@/lib/automation/buffer-window-exemption';

describe('buffer window exemption', () => {
  it('covers blog-posts, verify, and daily-report (not only blog-posts)', () => {
    expect(isBufferWindowExemptJob('buffer-blog-posts')).toBe(true);
    expect(isBufferWindowExemptJob('buffer-verify')).toBe(true);
    expect(isBufferWindowExemptJob('buffer-daily-report')).toBe(true);
    expect(isBufferWindowExemptJob('automation-watchdog')).toBe(false);
  });

  it('suppresses missed-window when quota is met', () => {
    const result = evaluateBufferWindowExemption('buffer-verify', {
      kind: 'ok',
      result: {
        ok: true,
        date: '2026-08-18',
        scheduledCount: 5,
        requiredCount: 5,
        gapFilled: 0,
        issues: [],
      },
    });
    expect(result.suppress).toBe(true);
    expect(result.reason).toBe('buffer_quota_met');
  });

  it('suppresses missed-window when posts already exist (partial day)', () => {
    for (const job of ['buffer-blog-posts', 'buffer-verify', 'buffer-daily-report'] as const) {
      const result = evaluateBufferWindowExemption(job, {
        kind: 'ok',
        result: {
          ok: false,
          date: '2026-08-18',
          scheduledCount: 2,
          requiredCount: 5,
          gapFilled: 0,
          issues: ['Only 2/5'],
        },
      });
      expect(result.suppress).toBe(true);
      expect(result.reason).toBe('buffer_posts_already_exist');
    }
  });

  it('treats inspect 429 as transient — does not die solely because inspect failed', () => {
    const result = evaluateBufferWindowExemption('buffer-blog-posts', {
      kind: 'transient',
      message: 'Too many requests from this client.',
    });
    expect(result.suppress).toBe(true);
    expect(result.reason).toBe('buffer_inspect_transient');
  });

  it('does not suppress a true miss (zero posts, inspect ok)', () => {
    const result = evaluateBufferWindowExemption('buffer-blog-posts', {
      kind: 'ok',
      result: {
        ok: false,
        date: '2026-08-18',
        scheduledCount: 0,
        requiredCount: 5,
        gapFilled: 0,
        issues: ['Only 0/5'],
      },
    });
    expect(result.suppress).toBe(false);
  });
});
