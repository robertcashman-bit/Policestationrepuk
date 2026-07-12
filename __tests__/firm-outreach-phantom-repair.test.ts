import { describe, expect, it } from 'vitest';
import {
  isPhantomSend,
  reconcileProspectAfterPhantomRemoval,
} from '@/lib/firm-outreach/outreach/phantom-send-repair';
import type { FirmOutreachSend, FirmProspect } from '@/lib/firm-outreach/types';

function prospect(overrides: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: 'fop_1',
    firmKey: 'firm-1',
    firmName: 'Test LLP',
    prospectType: 'firm',
    status: 'sent',
    sequenceStep: 1,
    lastEmailAt: '2026-07-12T16:00:00.000Z',
    campaignId: 'agent_cover_kent_v1',
    sources: ['laa'],
    priorityScore: 0,
    enrichAttempts: 0,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    email: 'info@test.example',
    ...overrides,
  };
}

function send(overrides: Partial<FirmOutreachSend> = {}): FirmOutreachSend {
  return {
    id: 'fos_1',
    prospectId: 'fop_1',
    firmName: 'Test LLP',
    prospectType: 'firm',
    email: 'info@test.example',
    campaignId: 'agent_cover_kent_v1',
    sequenceStep: 0,
    subject: 'Test',
    status: 'sent',
    createdAt: '2026-07-04T10:00:00.000Z',
    sentAt: '2026-07-04T10:00:00.000Z',
    resendMessageId: 'abc-123',
    ...overrides,
  };
}

describe('isPhantomSend', () => {
  it('flags sent rows without resendMessageId', () => {
    expect(isPhantomSend(send({ resendMessageId: undefined }))).toBe(true);
    expect(isPhantomSend(send({ resendMessageId: 'dry-run' }))).toBe(true);
    expect(isPhantomSend(send({ resendMessageId: 'real-id' }))).toBe(false);
  });
});

describe('reconcileProspectAfterPhantomRemoval', () => {
  it('reverts to ready_to_send when only phantom sends existed', () => {
    const p = prospect({ sequenceStep: 1, lastEmailAt: '2026-07-12T16:00:00.000Z' });
    const next = reconcileProspectAfterPhantomRemoval(p, []);
    expect(next?.status).toBe('ready_to_send');
    expect(next?.sequenceStep).toBe(0);
    expect(next?.lastEmailAt).toBeUndefined();
  });

  it('restores step 0 after phantom follow-up when real step 0 exists', () => {
    const p = prospect({ sequenceStep: 1, lastEmailAt: '2026-07-12T16:00:00.000Z' });
    const real = send({ sequenceStep: 0, sentAt: '2026-07-04T10:00:00.000Z' });
    const next = reconcileProspectAfterPhantomRemoval(p, [real]);
    expect(next?.status).toBe('sent');
    expect(next?.sequenceStep).toBe(0);
    expect(next?.lastEmailAt).toBe('2026-07-04T10:00:00.000Z');
  });

  it('leaves terminal statuses untouched', () => {
    const p = prospect({ status: 'unsubscribed' });
    expect(reconcileProspectAfterPhantomRemoval(p, [])).toBeNull();
  });
});
