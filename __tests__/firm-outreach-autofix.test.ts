import { describe, expect, it, vi } from 'vitest';
import {
  capDriftBlocksSending,
  collectCapDriftCheckDates,
  detectCampaignSendRecovery,
  minutesSinceSendWindow,
  passedSendWindowsToday,
  summarizeCapDrifts,
} from '@/lib/firm-outreach/outreach/outreach-autofix';
import type { FirmOutreachSend, OutreachRunLog } from '@/lib/firm-outreach/types';

function send(overrides: Partial<FirmOutreachSend> = {}): FirmOutreachSend {
  return {
    id: 'fos_1',
    prospectId: 'fop_1',
    firmName: 'Test LLP',
    prospectType: 'firm',
    email: 'info@test.example',
    campaignId: 'whatsapp_invite_v1',
    sequenceStep: 0,
    subject: 'Test',
    status: 'sent',
    createdAt: '2026-07-12T10:00:00.000Z',
    sentAt: '2026-07-12T10:00:00.000Z',
    resendMessageId: 'abc-123',
    ...overrides,
  };
}

function runLog(overrides: Partial<OutreachRunLog> = {}): OutreachRunLog {
  return {
    campaignId: 'whatsapp_invite_v1',
    startedAt: '2026-07-16T12:00:00.000Z',
    finishedAt: '2026-07-16T12:01:00.000Z',
    dryRun: false,
    attempted: 0,
    sent: 0,
    failed: 0,
    skipped: 10,
    suppressed: 0,
    skipReasons: {},
    failures: [],
    elapsedMs: 1000,
    dailyCap: 45,
    sentTodayBefore: 0,
    ...overrides,
  };
}

describe('collectCapDriftCheckDates', () => {
  it('includes anchor, send dates, and lookback days', () => {
    const dates = collectCapDriftCheckDates(
      [send({ sentAt: '2026-07-10T10:00:00.000Z' })],
      { anchorDate: '2026-07-16', lookbackDays: 3 },
    );
    expect(dates).toContain('2026-07-16');
    expect(dates).toContain('2026-07-10');
    expect(dates).toContain('2026-07-14');
  });
});

describe('passedSendWindowsToday', () => {
  it('returns windows past the grace period', () => {
    const now = new Date('2026-07-16T12:45:00.000Z');
    const passed = passedSendWindowsToday(now, 30);
    expect(passed.some((w) => w.hour === 12 && w.minute === 0)).toBe(true);
    expect(passed.some((w) => w.hour === 14 && w.minute === 30)).toBe(false);
  });
});

describe('minutesSinceSendWindow', () => {
  it('is negative before the window starts', () => {
    const now = new Date('2026-07-16T11:50:00.000Z');
    expect(minutesSinceSendWindow({ hour: 12, minute: 0 }, now)).toBe(-10);
  });
});

describe('capDriftBlocksSending', () => {
  it('blocks when counter exceeds real sends', () => {
    expect(
      capDriftBlocksSending({
        campaignId: 'agent_cover_kent_v1',
        date: '2026-07-16',
        counterValue: 70,
        realCount: 3,
      }),
    ).toBe(true);
    expect(
      capDriftBlocksSending({
        campaignId: 'agent_cover_kent_v1',
        date: '2026-07-16',
        counterValue: 3,
        realCount: 3,
      }),
    ).toBe(false);
  });
});

describe('detectCampaignSendRecovery', () => {
  const base = {
    campaignId: 'whatsapp_invite_v1',
    date: '2026-07-16',
    dueCount: 5,
    realSendsToday: 0,
    graceMinutes: 30,
  };

  it('returns cap_drift_blocking before send windows when due prospects exist', () => {
    const now = new Date('2026-07-16T08:00:00.000Z');
    const result = detectCampaignSendRecovery({
      ...base,
      now,
      latest: null,
      todayCapDrift: {
        campaignId: 'whatsapp_invite_v1',
        date: '2026-07-16',
        counterValue: 70,
        realCount: 0,
      },
    });
    expect(result?.reasons).toContain('cap_drift_blocking');
  });

  it('returns missed_send_window after grace with zero real sends', () => {
    const now = new Date('2026-07-16T12:45:00.000Z');
    const result = detectCampaignSendRecovery({
      ...base,
      now,
      latest: runLog({ sent: 0 }),
      todayCapDrift: undefined,
    });
    expect(result?.reasons).toContain('missed_send_window');
  });

  it('returns send_run_failed when latest run had failures', () => {
    const now = new Date('2026-07-16T13:00:00.000Z');
    const result = detectCampaignSendRecovery({
      ...base,
      now,
      latest: runLog({ failed: 2, sent: 0 }),
      todayCapDrift: undefined,
    });
    expect(result?.reasons).toContain('send_run_failed');
  });

  it('returns null when no due prospects', () => {
    const now = new Date('2026-07-16T13:00:00.000Z');
    expect(
      detectCampaignSendRecovery({
        ...base,
        dueCount: 0,
        now,
        latest: runLog(),
        todayCapDrift: undefined,
      }),
    ).toBeNull();
  });
});

describe('summarizeCapDrifts', () => {
  it('formats drift rows for logging', () => {
    expect(
      summarizeCapDrifts([
        {
          campaignId: 'agent_cover_kent_v1',
          date: '2026-07-16',
          counterValue: 70,
          realCount: 3,
        },
      ]),
    ).toContain('counter=70');
  });
});

describe('shouldAllowWatchdogKick', () => {
  it('allows kick when no prior kick recorded', async () => {
    vi.spyOn(await import('@/lib/kv'), 'getKV').mockReturnValue(null);
    const { shouldAllowWatchdogKick } = await import(
      '@/lib/firm-outreach/outreach/outreach-autofix'
    );
    expect(await shouldAllowWatchdogKick('2026-07-16', 'whatsapp_invite_v1', false)).toBe(true);
    vi.restoreAllMocks();
  });

  it('bypasses cooldown after cap fix', async () => {
    const kv = {
      get: vi.fn().mockResolvedValue(Date.now()),
      set: vi.fn(),
    };
    vi.spyOn(await import('@/lib/kv'), 'getKV').mockReturnValue(kv as never);
    const { shouldAllowWatchdogKick } = await import(
      '@/lib/firm-outreach/outreach/outreach-autofix'
    );
    expect(await shouldAllowWatchdogKick('2026-07-16', 'whatsapp_invite_v1', true)).toBe(true);
    vi.restoreAllMocks();
  });
});
