import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { FirmOutreachSend, FirmProspect } from '@/lib/firm-outreach/types';

const mockCountProspectsByStatus = vi.fn();
const mockListAllSends = vi.fn();
const mockListAllSuppressions = vi.fn();
const mockGetProspectsByIds = vi.fn();
const mockGetSuppressionsByEmails = vi.fn();
const mockListProspectIdsByStatus = vi.fn();
const mockListProspectIdsByRecordStatus = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  countProspectsByStatus: (...args: unknown[]) => mockCountProspectsByStatus(...args),
  listAllSends: (...args: unknown[]) => mockListAllSends(...args),
  listAllSuppressions: (...args: unknown[]) => mockListAllSuppressions(...args),
  getProspectsByIds: (...args: unknown[]) => mockGetProspectsByIds(...args),
  getSuppressionsByEmails: (...args: unknown[]) => mockGetSuppressionsByEmails(...args),
  listProspectIdsByStatus: (...args: unknown[]) => mockListProspectIdsByStatus(...args),
  listProspectIdsByRecordStatus: (...args: unknown[]) => mockListProspectIdsByRecordStatus(...args),
}));

describe('buildOutreachActivityReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountProspectsByStatus.mockResolvedValue({
      discovered: 4547,
      ready_to_send: 42,
      sent: 1,
      excluded: 4,
      no_email: 0,
      joined_whatsapp: 0,
      bounced: 0,
      unsubscribed: 0,
      enriched: 0,
    });
    mockListAllSuppressions.mockResolvedValue([]);
    mockGetProspectsByIds.mockResolvedValue(new Map());
    mockGetSuppressionsByEmails.mockResolvedValue(new Map());
    mockListProspectIdsByStatus.mockResolvedValue([]);
    mockListProspectIdsByRecordStatus.mockResolvedValue([]);
  });

  it('loads ready-to-send prospect ids for admin queue (batched mget)', async () => {
    mockListAllSends.mockResolvedValue([]);
    mockListProspectIdsByStatus.mockImplementation((status: string) => {
      if (status === 'sent') return Promise.resolve([]);
      if (status === 'excluded') return Promise.resolve([]);
      if (status === 'ready_to_send') return Promise.resolve(['fop_ready1']);
      return Promise.resolve([]);
    });
    mockGetProspectsByIds.mockImplementation((ids: string[]) => {
      if (ids.includes('fop_ready1')) {
        return Promise.resolve(
          new Map([
            [
              'fop_ready1',
              {
                id: 'fop_ready1',
                prospectType: 'firm',
                firmName: 'Crime Defence LLP',
                firmKey: 'crime-defence',
                email: 'crime@defence.co.uk',
                sources: ['laa'],
                status: 'ready_to_send',
                priorityScore: 80,
                sequenceStep: 0,
                campaignId: 'whatsapp_invite_v1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-02T00:00:00Z',
                enrichAttempts: 0,
              },
            ],
          ]),
        );
      }
      return Promise.resolve(new Map());
    });

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('ready_to_send');
    expect(report.readyToSendProspects).toHaveLength(1);
    expect(report.readyToSendProspects[0].firmName).toBe('Crime Defence LLP');
  });

  it('loads excluded prospect ids for admin excluded tab (batched mget)', async () => {
    mockListAllSends.mockResolvedValue([]);
    mockListProspectIdsByStatus.mockImplementation((status: string) => {
      if (status === 'sent') return Promise.resolve([]);
      if (status === 'excluded') return Promise.resolve(['fop_ex1']);
      return Promise.resolve([]);
    });
    mockGetProspectsByIds.mockImplementation((ids: string[]) => {
      if (ids.includes('fop_ex1')) {
        return Promise.resolve(
          new Map([
            [
              'fop_ex1',
              {
                id: 'fop_ex1',
                prospectType: 'firm',
                firmName: 'Brachers LLP',
                firmKey: 'brachers',
                email: 'info@brachers.co.uk',
                sources: ['archive'],
                status: 'excluded',
                excludedReason: 'archive_only_not_on_laa_or_dscc',
                priorityScore: 0,
                sequenceStep: 0,
                campaignId: 'whatsapp_invite_v1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-02T00:00:00Z',
                enrichAttempts: 0,
              },
            ],
          ]),
        );
      }
      return Promise.resolve(new Map());
    });

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('excluded');
    expect(report.excludedProspects).toHaveLength(1);
    expect(report.excludedProspects[0].excludedReason).toBe('archive_only_not_on_laa_or_dscc');
  });

  it('uses countProspectsByStatus for summary counts, not bulk discovered loads', async () => {
    mockListAllSends.mockResolvedValue([]);

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(mockCountProspectsByStatus).toHaveBeenCalledTimes(1);
    expect(mockListProspectIdsByStatus).not.toHaveBeenCalledWith('discovered');
    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('ready_to_send');
    expect(report.summary.discovered).toBe(4547);
    expect(report.summary.readyToSend).toBe(42);
  });

  it('loads sent, excluded, and ready prospect ids (batched mget)', async () => {
    mockListAllSends.mockResolvedValue([]);
    mockListProspectIdsByRecordStatus.mockResolvedValue(['fop_a', 'fop_b']);
    mockListProspectIdsByStatus.mockImplementation((status: string) => {
      if (status === 'excluded') return Promise.resolve([]);
      if (status === 'ready_to_send') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    await buildOutreachActivityReport();

    expect(mockListProspectIdsByRecordStatus).toHaveBeenCalledWith('sent');
    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('excluded');
    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('ready_to_send');
    expect(mockGetProspectsByIds).toHaveBeenCalledWith(['fop_a', 'fop_b']);
  });

  it('builds send rows with batched prospect and suppression lookups', async () => {
    const send: FirmOutreachSend = {
      id: 'fos_test1',
      prospectId: 'fop_abc',
      firmName: 'Test LLP',
      prospectType: 'firm',
      email: 'crime@test.co.uk',
      campaignId: 'whatsapp_invite_v1',
      sequenceStep: 0,
      subject: 'Police station cover',
      status: 'sent',
      createdAt: '2026-01-01T00:00:00Z',
      sentAt: '2026-01-02T00:00:00Z',
    };
    const prospect: FirmProspect = {
      id: 'fop_abc',
      prospectType: 'firm',
      firmName: 'Test LLP',
      firmKey: 'test-llp',
      county: 'Kent',
      sources: ['archive'],
      status: 'sent',
      priorityScore: 80,
      sequenceStep: 0,
      campaignId: 'whatsapp_invite_v1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
      enrichAttempts: 0,
    };

    mockListAllSends.mockResolvedValue([send]);
    mockGetProspectsByIds.mockResolvedValue(new Map([['fop_abc', prospect]]));
    mockGetSuppressionsByEmails.mockResolvedValue(new Map());

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(mockGetProspectsByIds).toHaveBeenCalledWith(['fop_abc']);
    expect(mockGetSuppressionsByEmails).toHaveBeenCalledWith(['crime@test.co.uk']);
    expect(report.sends).toHaveLength(1);
    expect(report.sends[0].county).toBe('Kent');
    expect(report.sends[0].sendStatus).toBe('sent');
  });

  it('completes quickly with large discovered count (no per-prospect fetches for counts)', async () => {
    mockListAllSends.mockResolvedValue([]);
    mockCountProspectsByStatus.mockResolvedValue({
      discovered: 5000,
      ready_to_send: 100,
      sent: 0,
      excluded: 0,
      no_email: 0,
      joined_whatsapp: 0,
      bounced: 0,
      unsubscribed: 0,
      enriched: 0,
    });

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );

    const start = Date.now();
    await buildOutreachActivityReport();
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('computes sentToday and sentLast7Days from send timestamps', async () => {
    const now = new Date();
    const todayIso = now.toISOString();
    const oldIso = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

    mockListAllSends.mockResolvedValue([
      {
        id: 'fos_today',
        prospectId: 'fop_1',
        firmName: 'A',
        prospectType: 'firm',
        email: 'a@test.co.uk',
        campaignId: 'whatsapp_invite_v1',
        sequenceStep: 0,
        subject: 's',
        status: 'sent',
        createdAt: todayIso,
        sentAt: todayIso,
      },
      {
        id: 'fos_old',
        prospectId: 'fop_2',
        firmName: 'B',
        prospectType: 'firm',
        email: 'b@test.co.uk',
        campaignId: 'whatsapp_invite_v1',
        sequenceStep: 0,
        subject: 's',
        status: 'sent',
        createdAt: oldIso,
        sentAt: oldIso,
      },
    ]);

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(report.summary.sentToday).toBe(1);
    expect(report.summary.sentLast7Days).toBe(1);
  });
});

describe('computeSendWindowCounts', () => {
  it('counts sends in UTC day and 7-day window', async () => {
    const { computeSendWindowCounts } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const now = Date.now();
    const today = new Date(now).toISOString();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

    const counts = computeSendWindowCounts([
      { sentAt: today },
      { sentAt: threeDaysAgo },
      { sentAt: tenDaysAgo },
    ]);

    expect(counts.sentToday).toBe(1);
    expect(counts.sentLast7Days).toBe(2);
  });
});

describe('computeFunnelFromSends', () => {
  it('counts clicked sends as delivered and opened', async () => {
    const { computeFunnelFromSends } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const funnel = computeFunnelFromSends([
      { status: 'sent' },
      { status: 'delivered', deliveredAt: '2026-07-01T00:00:00Z' },
      { status: 'opened', deliveredAt: '2026-07-01T00:00:00Z', openedAt: '2026-07-01T01:00:00Z' },
      {
        status: 'clicked',
        deliveredAt: '2026-07-01T00:00:00Z',
        openedAt: '2026-07-01T01:00:00Z',
        clickedAt: '2026-07-01T02:00:00Z',
      },
      { status: 'bounced', bouncedAt: '2026-07-01T00:00:00Z' },
    ]);

    expect(funnel.delivered).toBe(3);
    expect(funnel.opened).toBe(2);
    expect(funnel.clicked).toBe(1);
    expect(funnel.bounced).toBe(1);
  });
});

describe('countUnsubscribedRecipients', () => {
  it('counts unique emailed recipients on the unsubscribe list only', async () => {
    const { countUnsubscribedRecipients } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const n = countUnsubscribedRecipients(
      [
        { email: 'a@firm.co.uk' },
        { email: 'a@firm.co.uk' },
        { email: 'b@firm.co.uk' },
        { email: 'c@firm.co.uk' },
      ],
      [
        { email: 'a@firm.co.uk', reason: 'unsubscribe' },
        { email: 'bounce@firm.co.uk', reason: 'bounce' },
        { email: 'never-emailed@firm.co.uk', reason: 'unsubscribe' },
      ],
    );
    expect(n).toBe(1);
  });
});

describe('GET /api/admin/firm-outreach', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns summary view by default when admin authorised', async () => {
    vi.doMock('@/lib/admin-auth', () => ({
      requireAdmin: vi.fn().mockResolvedValue({ ok: true, email: 'admin@test.co.uk' }),
    }));
    vi.doMock('@/lib/kv', () => ({
      getKV: vi.fn().mockReturnValue({}),
    }));
    vi.doMock('@/lib/firm-outreach/outreach/activity-report', () => ({
      getCachedOutreachSummaryView: vi.fn().mockResolvedValue({
        generatedAt: '2026-06-11T12:00:00Z',
        prospectCounts: { discovered: 10, ready_to_send: 2 },
        summary: {
          totalSends: 1,
          sentToday: 0,
          sentLast7Days: 0,
          uniqueRecipients: 1,
          bySendStatus: { sent: 1 },
          delivered: 0,
          opened: 0,
          waClicks: 0,
          joinedWhatsApp: 0,
          bounced: 0,
          complained: 0,
          unsubscribed: 0,
          pendingFollowUp1: 0,
          pendingFollowUp2: 0,
          readyToSend: 2,
          discovered: 10,
          noEmail: 0,
          excluded: 0,
        },
        recentSends: [],
      }),
      buildOutreachActivityReport: vi.fn(),
      buildReadyProspectsView: vi.fn(),
      buildExcludedProspectsView: vi.fn(),
      buildSendsView: vi.fn(),
      buildSuppressionsView: vi.fn(),
      emptyOutreachActivityReport: vi.fn(),
      activityReportToCsv: vi.fn(),
    }));
    vi.doMock('@/lib/firm-outreach/constants', () => ({
      dailySendCap: () => 30,
      outreachPaused: () => false,
      outreachSendEnabled: () => true,
    }));
    vi.doMock('@/lib/firm-outreach/config-status', () => ({
      getOutreachConfigStatus: vi.fn().mockResolvedValue({
        kvConfigured: true,
        resendConfigured: true,
        outreachEnabled: true,
        sendAllowed: true,
        sendHealthy: true,
        sendBlockers: [],
        campaignSendHealth: [],
        effectivePaused: false,
      }),
    }));
    vi.doMock('@/lib/firm-outreach/ops-status', () => ({
      getOutreachOpsStatus: vi.fn().mockResolvedValue({
        runLog: null,
        resendSendCount: 0,
        resendQuotaRemaining: 100,
        perSiteDigestSent: false,
        latestFailures: [],
        config: {},
      }),
    }));

    const { GET } = await import('@/app/api/admin/firm-outreach/route');
    const res = await GET(new Request('http://localhost/api/admin/firm-outreach'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.view).toBe('summary');
    expect(json.counts.discovered).toBe(10);
    expect(json.summary.totalSends).toBe(1);
  });

  it('returns ready view when requested', async () => {
    vi.doMock('@/lib/admin-auth', () => ({
      requireAdmin: vi.fn().mockResolvedValue({ ok: true, email: 'admin@test.co.uk' }),
    }));
    vi.doMock('@/lib/kv', () => ({
      getKV: vi.fn().mockReturnValue({}),
    }));
    vi.doMock('@/lib/firm-outreach/outreach/activity-report', () => ({
      buildReadyProspectsView: vi.fn().mockResolvedValue([
        { prospectId: 'fop_1', firmName: 'Test LLP', prospectType: 'firm', sources: [], priorityScore: 1, updatedAt: '2026-01-01', suppressed: false },
      ]),
      getCachedOutreachSummaryView: vi.fn(),
      buildOutreachActivityReport: vi.fn(),
      buildExcludedProspectsView: vi.fn(),
      buildSendsView: vi.fn(),
      buildSuppressionsView: vi.fn(),
      emptyOutreachActivityReport: vi.fn(),
      activityReportToCsv: vi.fn(),
    }));
    vi.doMock('@/lib/firm-outreach/constants', () => ({
      dailySendCap: () => 30,
      outreachPaused: () => false,
      outreachSendEnabled: () => true,
    }));
    vi.doMock('@/lib/firm-outreach/config-status', () => ({
      getOutreachConfigStatus: vi.fn().mockResolvedValue({
        kvConfigured: true,
        resendConfigured: true,
        outreachEnabled: true,
        sendAllowed: true,
        sendHealthy: true,
        sendBlockers: [],
        campaignSendHealth: [],
        effectivePaused: false,
      }),
    }));
    vi.doMock('@/lib/firm-outreach/ops-status', () => ({
      getOutreachOpsStatus: vi.fn().mockResolvedValue({
        runLog: null,
        resendSendCount: 0,
        resendQuotaRemaining: 100,
        perSiteDigestSent: false,
        latestFailures: [],
        config: {},
      }),
    }));

    const { GET } = await import('@/app/api/admin/firm-outreach/route');
    const res = await GET(new Request('http://localhost/api/admin/firm-outreach?view=ready'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.view).toBe('ready');
    expect(json.readyToSendProspects).toHaveLength(1);
  });
});
