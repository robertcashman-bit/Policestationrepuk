import { isProviderAcceptedMessageId } from '@robertcashman/firm-outreach-core';
import { Resend } from 'resend';
import { listAllSends } from '../storage';
import type { FirmOutreachSend } from '../types';
import { allOutreachCampaignSites, outreachCampaignSite } from './campaign-sites';
import {
  claimMorningDigest,
  isMorningDigestSendWindow,
  localDateInTimezone,
  markMorningDigestSent,
  NOTIFY_TIMEZONE,
  outreachDigestDate,
  previousDigestDate,
  wasMorningDigestSent,
} from './daily-digest';
import { repukFromAddress } from './from-address';
import { outreachNotifyEmail } from './notify-recipient';

const TOUCH_LABELS = ['Initial invite', 'Follow-up (day 7)', 'Follow-up (day 21)'] as const;
const FROM_EMAIL = repukFromAddress();

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

function escapeHtml(value: string | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function touchLabel(step: number): string {
  return TOUCH_LABELS[step] ?? `Touch ${step + 1}`;
}

function isRealSendOnDate(send: FirmOutreachSend, reportDate: string): boolean {
  if (!send.sentAt || !isProviderAcceptedMessageId(send.resendMessageId)) return false;
  return localDateInTimezone(new Date(send.sentAt), NOTIFY_TIMEZONE) === reportDate;
}

export interface MorningOutreachSendRow {
  campaignId: string;
  site: string;
  siteLabel: string;
  firmName: string;
  email: string;
  touchLabel: string;
  sentAt: string;
}

export interface MorningOutreachResults {
  digestDate: string;
  reportDate: string;
  totalSent: number;
  byCampaign: Array<{
    campaignId: string;
    site: string;
    label: string;
    count: number;
    sends: MorningOutreachSendRow[];
  }>;
}

export function buildMorningOutreachResults(
  sends: FirmOutreachSend[],
  reportDate: string,
): MorningOutreachResults {
  const realOnDate = sends
    .filter((s) => isRealSendOnDate(s, reportDate))
    .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''));

  const byCampaign = allOutreachCampaignSites().map((meta) => {
    const campaignSends = realOnDate
      .filter((s) => s.campaignId === meta.campaignId)
      .map((s) => ({
        campaignId: meta.campaignId,
        site: meta.site,
        siteLabel: meta.label,
        firmName: s.firmName || '—',
        email: s.email,
        touchLabel: touchLabel(s.sequenceStep),
        sentAt: s.sentAt!,
      }));

    return {
      campaignId: meta.campaignId,
      site: meta.site,
      label: meta.label,
      count: campaignSends.length,
      sends: campaignSends,
    };
  });

  return {
    digestDate: outreachDigestDate(),
    reportDate,
    totalSent: realOnDate.length,
    byCampaign,
  };
}

function renderCampaignSection(block: MorningOutreachResults['byCampaign'][number]): string {
  if (block.count === 0) {
    return `
      <h3>${escapeHtml(block.label)} (${escapeHtml(block.site)}) — 0 sent</h3>
      <p>No emails sent from this site on this date.</p>
    `;
  }

  const rows = block.sends
    .map(
      (r) =>
        `<tr>
          <td>${escapeHtml(r.firmName)}</td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.touchLabel)}</td>
          <td>${escapeHtml(r.sentAt.slice(0, 19).replace('T', ' '))} UTC</td>
        </tr>`,
    )
    .join('');

  return `
    <h3>${escapeHtml(block.label)} (${escapeHtml(block.site)}) — ${block.count} sent</h3>
    <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:14px;width:100%;margin-bottom:20px">
      <thead>
        <tr>
          <th>Firm</th>
          <th>Sent to</th>
          <th>Touch</th>
          <th>Sent at</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderMorningResultsHtml(results: MorningOutreachResults): string {
  const summaryLines = results.byCampaign
    .map((b) => `<li><strong>${escapeHtml(b.site)}</strong>: ${b.count} sent</li>`)
    .join('');

  const campaignSections = results.byCampaign.map(renderCampaignSection).join('');

  return `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:820px">
      <h2 style="margin:0 0 12px">Firm outreach — daily results</h2>
      <p style="margin:0 0 16px;line-height:1.5">
        <strong>Report date:</strong> ${escapeHtml(results.reportDate)} (Europe/London)<br/>
        <strong>Total sent:</strong> ${results.totalSent}
      </p>
      <h3 style="margin:0 0 8px">By website</h3>
      <ul style="margin:0 0 20px;padding-left:20px;line-height:1.6">${summaryLines}</ul>
      ${campaignSections}
      <p style="margin-top:24px;color:#64748b;font-size:12px">
        Only provider-confirmed sends (Resend message ID) are included.
        <a href="https://policestationrepuk.org/admin/firm-outreach">Open admin dashboard</a>
      </p>
    </div>
  `;
}

export interface MorningOutreachResultsEmailResult {
  sent: boolean;
  reason?: string;
  digestDate: string;
  reportDate: string;
  totalSent: number;
}

export async function sendMorningOutreachResultsEmail(opts?: {
  force?: boolean;
  now?: Date;
}): Promise<MorningOutreachResultsEmailResult> {
  const now = opts?.now ?? new Date();
  const digestDate = outreachDigestDate(now);
  const reportDate = previousDigestDate(digestDate);

  if (!opts?.force && !isMorningDigestSendWindow(now)) {
    return {
      sent: false,
      reason: 'outside_send_window',
      digestDate,
      reportDate,
      totalSent: 0,
    };
  }

  if (!opts?.force) {
    if (await wasMorningDigestSent(digestDate)) {
      return {
        sent: false,
        reason: 'already_sent_today',
        digestDate,
        reportDate,
        totalSent: 0,
      };
    }
    if (!(await claimMorningDigest(digestDate))) {
      return {
        sent: false,
        reason: 'already_sent_today',
        digestDate,
        reportDate,
        totalSent: 0,
      };
    }
  }

  const allSends = await listAllSends();
  const results = buildMorningOutreachResults(allSends, reportDate);

  const siteSummary = results.byCampaign
    .filter((b) => b.count > 0)
    .map((b) => `${b.count} from ${b.site}`)
    .join(', ');

  const subject =
    results.totalSent > 0
      ? `[Firm outreach] ${results.totalSent} sent on ${reportDate}${siteSummary ? ` (${siteSummary})` : ''}`
      : `[Firm outreach] 0 sent on ${reportDate}`;

  const html = renderMorningResultsHtml(results);
  const to = outreachNotifyEmail();
  const client = getResend();

  if (!client) {
    console.info('[firm-outreach morning digest]', subject, {
      totalSent: results.totalSent,
      byCampaign: results.byCampaign.map((b) => ({
        site: b.site,
        count: b.count,
      })),
    });
    return {
      sent: false,
      reason: 'no_resend',
      digestDate,
      reportDate,
      totalSent: results.totalSent,
    };
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    await markMorningDigestSent(digestDate);
    return {
      sent: true,
      digestDate,
      reportDate,
      totalSent: results.totalSent,
    };
  } catch (err) {
    console.warn('[firm-outreach morning digest]', err);
    return {
      sent: false,
      reason: 'send_failed',
      digestDate,
      reportDate,
      totalSent: results.totalSent,
    };
  }
}

/** Human-readable site name for a send row (used in tests / scripts). */
export function siteForCampaignId(campaignId: string): string {
  return outreachCampaignSite(campaignId).site;
}
