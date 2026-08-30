import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/editorial-audit/email', () => ({
  sendEditorialAuditDigestEmail: vi.fn(async () => true),
}));

const getDailyAuditBucket = vi.fn();
const markDailyAuditSent = vi.fn();
const shouldSendDailyAudit = vi.fn();
const dailyAuditDate = vi.fn(() => '2026-06-07');

vi.mock('@/lib/editorial-audit/daily-notify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/editorial-audit/daily-notify')>();
  return {
    ...actual,
    getDailyAuditBucket: (...args: unknown[]) => getDailyAuditBucket(...args),
    markDailyAuditSent: (...args: unknown[]) => markDailyAuditSent(...args),
    shouldSendDailyAudit: (...args: unknown[]) => shouldSendDailyAudit(...args),
    dailyAuditDate: (...args: unknown[]) => dailyAuditDate(...args),
  };
});

import { resetAuditCursorForTests, selectAuditBatch } from '@/lib/editorial-audit/cursor';
import { proposedFixForCode } from '@/lib/editorial-audit/fixes';
import { notifyIfFindings } from '@/lib/editorial-audit/notify';
import { scanText } from '@/lib/editorial-audit/rules';
import { scanBatchFull, scanUnit } from '@/lib/editorial-audit/runner';
import { splitMarkdownSections } from '@/lib/editorial-audit/units';
import { sendEditorialAuditDigestEmail } from '@/lib/editorial-audit/email';
import { shouldRunLlm } from '@/lib/editorial-audit/llm-check';
import {
  hasPaceStatutoryCite,
  LEGACY_PACE_SOURCING_SNIPPETS,
  paceSourcingViolation,
} from '@/lib/editorial-audit/pace-sourcing';
import { scanFeeRateClaims } from '@/lib/editorial-audit/fee-check';
import { POLICE_STATION_FIXED_FEE } from '@/lib/laa-rates';
import type { AuditFinding, AuditUnit } from '@/lib/editorial-audit/types';

function makeUnit(id: string, text = '', overrides: Partial<AuditUnit> = {}): AuditUnit {
  return {
    id,
    url: `/Blog/${id}`,
    contentType: 'blog',
    sourceFile: 'lib/blog/articles-batch-*.ts',
    sectionTitle: 'Test section',
    sectionIndex: 0,
    text,
    llmEligible: false,
    ...overrides,
  };
}

describe('editorial audit rules', () => {
  it('flags superseded £181 fee as PROBLEM with fix hint', () => {
    const flags = scanText('The fixed fee was £181 for attendance.');
    expect(flags.some((f) => f.code === 'fee-181' && f.severity === 'PROBLEM')).toBe(true);
    expect(proposedFixForCode('fee-181')).toMatch(/SI 2025\/1251/);
  });

  it('flags Bail Act 2024 as PROBLEM', () => {
    const flags = scanText('Under the Bail Act 2024, limits apply.');
    expect(flags.some((f) => f.code === 'bail-act-2024')).toBe(true);
  });

  it('allows registered case citations', () => {
    const flags = scanText('See R v Smith for an example only.');
    expect(flags.filter((f) => f.code === 'unregistered-case')).toHaveLength(0);
  });
});

describe('editorial audit section splitting', () => {
  it('splits markdown on ## headings', () => {
    const sections = splitMarkdownSections('Intro\n\n## First\n\nBody one\n\n## Second\n\nBody two');
    expect(sections).toHaveLength(3);
    expect(sections[1].title).toBe('First');
    expect(sections[2].title).toBe('Second');
  });
});

describe('editorial audit cursor rotation', () => {
  beforeEach(async () => {
    await resetAuditCursorForTests();
  });

  it('advances through units without repeating within a batch', async () => {
    const units = [makeUnit('a'), makeUnit('b'), makeUnit('c'), makeUnit('d'), makeUnit('e')];
    const first = await selectAuditBatch(units, 2);
    expect(first.batch).toHaveLength(2);
    expect(first.batch.map((u) => u.id)).toEqual(['a', 'b']);
    expect(new Set(first.batch.map((u) => u.id)).size).toBe(2);

    const second = await selectAuditBatch(units, 2);
    expect(second.batch.map((u) => u.id)).toEqual(['c', 'd']);
  });

  it('wraps cursor after reaching end of list', async () => {
    const units = [makeUnit('a'), makeUnit('b'), makeUnit('c')];
    await selectAuditBatch(units, 2); // a, b
    await selectAuditBatch(units, 2); // c, a
    await selectAuditBatch(units, 2); // b, c
    const fourth = await selectAuditBatch(units, 2);
    expect(fourth.batch[0].id).toBe('a');
  });
});

describe('editorial audit batch scan', () => {
  it('produces findings with proposed fix from scanUnit', () => {
    const findings = scanUnit(makeUnit('fee-test', 'Police station fee was £181 last year.'));
    expect(findings.some((f) => f.code === 'fee-181' && f.severity === 'PROBLEM')).toBe(true);
    expect(findings.find((f) => f.code === 'fee-181')?.proposedFix).toMatch(/SI 2025\/1251/);
  });
});

describe('editorial audit PACE sourcing', () => {
  it('flags legacy bare-PACE snippets', () => {
    for (const snippet of LEGACY_PACE_SOURCING_SNIPPETS) {
      expect(paceSourcingViolation(snippet.text)).toBe(true);
    }
  });

  it('passes when PACE and Codes of Practice are cited', () => {
    const text =
      'Reps must apply PACE and Codes of Practice — not improvise. That includes custody rights under Code C, appropriate adults for juveniles and vulnerable adults, interpreter needs, and medical assessments where relevant.';
    expect(hasPaceStatutoryCite(text)).toBe(true);
    expect(paceSourcingViolation(text)).toBe(false);
  });

  it('scanUnit emits pace-sourcing REVIEW for bare PACE copy', () => {
    const findings = scanUnit(
      makeUnit('pace', LEGACY_PACE_SOURCING_SNIPPETS[0].text, { contentType: 'guide', url: '/PACE' }),
    );
    expect(findings.some((f) => f.code === 'pace-sourcing')).toBe(true);
  });
});

describe('editorial audit LAA fee vs canonical rates', () => {
  it('flags page copy that disagrees with lib/laa-rates police-station fixed fee', () => {
    const text =
      'Under the current LAA scheme the harmonised police station fixed fee is £250 for every attendance.';
    const flags = scanFeeRateClaims(text);
    expect(flags.some((f) => f.code === 'fee-rate-mismatch-police-station')).toBe(true);
    expect(POLICE_STATION_FIXED_FEE).toBe(320);
  });

  it('does not flag the canonical £320 harmonised fee', () => {
    const text =
      'The harmonised police station fixed fee is £320 from 22 December 2025 (SI 2025/1251).';
    expect(scanFeeRateClaims(text)).toHaveLength(0);
  });

  it('scanUnit surfaces fee mismatch as PROBLEM', () => {
    const findings = scanUnit(
      makeUnit(
        'rates-bad',
        'The harmonised police station fixed fee is £200 for all schemes.',
        { contentType: 'fee-rights', url: '/PoliceStationRates', sourceFile: 'app/PoliceStationRates/page.tsx' },
      ),
    );
    expect(findings.some((f) => f.code === 'fee-rate-mismatch-police-station')).toBe(true);
  });
});

describe('editorial audit shouldRunLlm', () => {
  const baseState = { llm_calls_this_month: 0, estimated_spend_usd: 0 };
  const flagged: AuditFinding[] = [
    {
      fingerprint: 'x:fee-181',
      unitId: 'x',
      url: '/Blog/x',
      sectionTitle: 't',
      sourceFile: 'f',
      severity: 'PROBLEM',
      code: 'fee-181',
      reason: 'bad fee',
      proposedFix: 'fix',
    },
  ];

  it('returns false without OPENAI_API_KEY', () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const unit = makeUnit('llm', 'text about fees', { llmEligible: true, contentType: 'guide' });
    expect(shouldRunLlm(unit, flagged, 0, baseState)).toBe(false);
    if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
  });

  it('returns false when rules_flagged_only and no findings', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const unit = makeUnit('llm', 'clean text', { llmEligible: true, contentType: 'guide' });
    expect(shouldRunLlm(unit, [], 0, baseState)).toBe(false);
  });

  it('returns true when key set, eligible, and rules flagged', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const unit = makeUnit('llm', 'flagged text', { llmEligible: true, contentType: 'guide' });
    expect(shouldRunLlm(unit, flagged, 0, baseState)).toBe(true);
  });

  it('respects per-run call cap', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const unit = makeUnit('llm', 'flagged text', { llmEligible: true, contentType: 'guide' });
    expect(shouldRunLlm(unit, flagged, 2, baseState)).toBe(false);
  });
});

describe('editorial audit live URL', () => {
  it('flags HTTP errors from live fetch', async () => {
    const fetchMock = vi.fn(async () => ({
      status: 500,
      text: async () => 'error',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await scanBatchFull(
      [makeUnit('live', 'ok copy with no red flags here')],
      {
        siteUrl: 'https://example.test',
        skipLlm: true,
        llmState: { llm_calls_this_month: 0, estimated_spend_usd: 0 },
      },
    );

    expect(result.liveUrlsChecked).toBe(1);
    expect(result.findings.some((f) => f.code === 'live-url-http-error')).toBe(true);
    vi.unstubAllGlobals();
  });
});

describe('editorial audit cron schedule', () => {
  it('schedules weekdays 06:00 UTC (07:00 BST) not Monday-only 17:00', async () => {
    const { readFileSync } = await import('fs');
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      crons?: Array<{ path: string; schedule: string }>;
    };
    const editorial = (vercel.crons ?? []).filter((c) => c.path === '/api/cron/editorial-audit');
    expect(editorial).toHaveLength(1);
    expect(editorial[0].schedule).toBe('0 6 * * 1-5');
  });
});

describe('editorial audit daily notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldSendDailyAudit.mockReturnValue(true);
    getDailyAuditBucket.mockResolvedValue(null);
  });

  it('does not email when batch is clean', async () => {
    const result = await notifyIfFindings([], 5);
    expect(result.emailed).toBe(false);
    expect(result.findingCount).toBe(0);
    expect(sendEditorialAuditDigestEmail).not.toHaveBeenCalled();
  });

  it('sends digest when findings exist and send window is open', async () => {
    const findings = scanUnit(makeUnit('x', 'Fee was £181'));
    const result = await notifyIfFindings(findings, 3);
    expect(result.emailed).toBe(true);
    expect(sendEditorialAuditDigestEmail).toHaveBeenCalledTimes(1);
    expect(markDailyAuditSent).toHaveBeenCalledWith('2026-06-07');
  });

  it('queues findings but waits outside send window', async () => {
    shouldSendDailyAudit.mockReturnValue(false);
    const findings = scanUnit(makeUnit('x', 'Fee was £181'));
    const result = await notifyIfFindings(findings, 3);
    expect(result.emailed).toBe(false);
    expect(result.pendingDailyDigest).toBe(true);
    expect(sendEditorialAuditDigestEmail).not.toHaveBeenCalled();
  });

  it('does not send a second email on the same day', async () => {
    getDailyAuditBucket.mockResolvedValue({
      date: '2026-06-07',
      findings: [],
      unitsScanned: 5,
      notifiedAt: '2026-06-07T19:00:00.000Z',
    });
    const findings = scanUnit(makeUnit('x', 'Fee was £181'));
    const result = await notifyIfFindings(findings, 3);
    expect(result.emailed).toBe(false);
    expect(sendEditorialAuditDigestEmail).not.toHaveBeenCalled();
  });
});
