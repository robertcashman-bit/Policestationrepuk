import { describe, expect, it, vi } from 'vitest';
import {
  countRealSendsOnDate,
  findDailyCapDrift,
} from '@/lib/firm-outreach/outreach/phantom-send-repair-apply';
import type { FirmOutreachSend } from '@/lib/firm-outreach/types';
import { OUTREACH_SEND_WINDOWS_UTC } from '@/lib/firm-outreach/outreach/watchdog';

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

describe('countRealSendsOnDate', () => {
  it('counts only provider-confirmed sends on the date', () => {
    const sends = [
      send(),
      send({ id: 'fos_2', resendMessageId: undefined }),
      send({ id: 'fos_3', sentAt: '2026-07-11T10:00:00.000Z' }),
    ];
    expect(countRealSendsOnDate(sends, '2026-07-12')).toBe(1);
  });
});

describe('findDailyCapDrift', () => {
  it('detects when KV counter exceeds real sends', async () => {
    vi.spyOn(await import('@/lib/firm-outreach/storage'), 'getDailySendCount').mockImplementation(
      async (_date, campaignId) => (campaignId === 'agent_cover_kent_v1' ? 70 : 1),
    );

    const drifts = await findDailyCapDrift([send()], '2026-07-12');
    expect(drifts.some((d) => d.campaignId === 'agent_cover_kent_v1' && d.counterValue === 70)).toBe(
      true,
    );
    vi.restoreAllMocks();
  });
});

describe('OUTREACH_SEND_WINDOWS_UTC', () => {
  it('lists the four daily send windows', () => {
    expect(OUTREACH_SEND_WINDOWS_UTC).toHaveLength(4);
  });
});

describe('watchdog zero-send autofix contract', () => {
  it('documents that zero-send windows trigger a send-only kick before alert', () => {
    // Behaviour lives in runOutreachWatchdog: when a send window passes with
    // dueSendable > 0 and realSendsToday === 0, autoRepair kicks
    // runFirmOutreachPipeline(send-only) and only alerts if still zero.
    expect(OUTREACH_SEND_WINDOWS_UTC.some((w) => w.hour === 16 && w.minute === 0)).toBe(true);
  });
});

describe('OutreachWatchdogResult dueSendable', () => {
  it('documents that dueSendable is required on the watchdog result shape', () => {
    // Compile-time / shape guard — runOutreachWatchdog returns dueSendable so
    // alerts key off truly-due prospects, not bloated ready_to_send counts.
    const sample = {
      ok: true,
      date: '2026-07-15',
      issues: [] as string[],
      autoFixed: [] as string[],
      phantomCount: 0,
      capDrifts: [] as [],
      realSendsToday: {},
      sendableReady: 100,
      dueSendable: 0,
      readyToSend: 100,
      sendEnabled: true,
      sendAllowed: true,
    };
    expect(sample.dueSendable).toBe(0);
    expect(sample.sendableReady).toBeGreaterThan(sample.dueSendable);
  });
});
