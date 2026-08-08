import type { ConsolidatedDailyReport, WorkspaceDailySection } from './build-daily-report';

const RECIPIENT_EMAIL_LIMIT = 200;

function escapeHtml(value: string | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderRecipients(section: WorkspaceDailySection): string {
  if (section.recipients.length === 0) {
    if (section.zeroReason) {
      return `<p><strong>0 emails accepted:</strong> ${escapeHtml(section.zeroReason.message)}</p>
        <p style="color:#64748b;font-size:12px;">Classification: <code>${escapeHtml(section.zeroReason.code)}</code></p>`;
    }
    return '<p>No provider-accepted recipients in this reporting period.</p>';
  }

  const rows = section.recipients.slice(0, RECIPIENT_EMAIL_LIMIT);
  const lines = rows
    .map((r, i) => {
      const name = r.contactName ? ` — ${escapeHtml(r.contactName)}` : '';
      return `<li>${i + 1}. ${escapeHtml(r.firmName)}${name} — <a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a> — <code>${escapeHtml(r.providerMessageId)}</code></li>`;
    })
    .join('\n');

  const truncated =
    section.recipients.length > RECIPIENT_EMAIL_LIMIT
      ? `<p style="color:#64748b;font-size:12px;">Showing first ${RECIPIENT_EMAIL_LIMIT} of ${section.recipients.length}. Full list is in the admin dashboard Send log.</p>`
      : '';

  return `<ol style="padding-left:20px;line-height:1.55;">${lines}</ol>${truncated}`;
}

function renderWorkspace(section: WorkspaceDailySection): string {
  return `
## ${section.label}

**Status:** ${section.status}

**Provider:** ${section.provider}  
**Sender:** ${section.sender}

| Metric | Value |
|--------|-------|
| Eligible recipients found | ${section.eligibleRecipientsFound} |
| Emails queued | ${section.emailsQueued} |
| Emails attempted | ${section.emailsAttempted} |
| Emails accepted by provider | ${section.emailsAcceptedByProvider} |
| Emails delivered | ${section.emailsDelivered} |
| Temporary failures | ${section.temporaryFailures} |
| Permanent failures | ${section.permanentFailures} |
| Retries scheduled | ${section.retriesScheduled} |
| Bounces | ${section.bounces} |
| Complaints | ${section.complaints} |
| Unsubscribes | ${section.unsubscribes} |
| Suppressed | ${section.suppressed} |
| Duplicate skips | ${section.duplicateSkips} |

**Provider allowance:** ${section.providerAllowance}  
**Used:** ${section.providerUsed}  
**Remaining:** ${section.providerRemaining}  
**Next reset:** ${section.nextReset}

**Outreach scheduler — last successful run:** ${section.lastSchedulerRun ?? 'n/a'}

**Autoheal:** runs ${section.autohealRuns}; repairs: ${
    section.autohealRepairs.length ? section.autohealRepairs.join(', ') : 'none'
  }  
**Outstanding faults:** ${
    section.outstandingFaults.length ? section.outstandingFaults.join('; ') : 'none'
  }

### ACTUAL RECIPIENTS ACCEPTED BY PROVIDER
${section.recipients.length === 0 ? (section.zeroReason?.message ?? 'None') : `${section.recipients.length} recipient(s)`}
`;
}

export function formatDailyReportSubject(report: ConsolidatedDailyReport): string {
  return `Daily Outreach Report — PoliceStationAgent + PoliceStationRepUK — ${report.date}`;
}

export function formatDailyReportText(report: ConsolidatedDailyReport): string {
  const actions =
    report.actionRequired.length === 0
      ? 'None — both outreach systems are operating normally.'
      : report.actionRequired.map((a) => `• ${a}`).join('\n');

  const recipBlock = (section: WorkspaceDailySection) => {
    if (section.recipients.length === 0) {
      return section.zeroReason
        ? `0 emails accepted: ${section.zeroReason.message}\n(${section.zeroReason.code})`
        : 'None';
    }
    return section.recipients
      .slice(0, RECIPIENT_EMAIL_LIMIT)
      .map(
        (r, i) =>
          `${i + 1}. ${r.firmName}${r.contactName ? ` — ${r.contactName}` : ''} — ${r.email} — ${r.providerMessageId}`,
      )
      .join('\n');
  };

  return `DAILY OUTREACH REPORT
Date: ${report.date}
Reporting period: ${report.reportingPeriodStart} → ${report.reportingPeriodEnd} (${report.timezone})

---

${renderWorkspace(report.psa)}

ACTUAL RECIPIENTS ACCEPTED BY PROVIDER:
${recipBlock(report.psa)}

---

${renderWorkspace(report.repuk)}

ACTUAL RECIPIENTS ACCEPTED BY PROVIDER:
${recipBlock(report.repuk)}

---

## TOTAL ACROSS BOTH WORKSPACES

Eligible: ${report.totals.eligible}
Attempted: ${report.totals.attempted}
Accepted: ${report.totals.accepted}
Delivered: ${report.totals.delivered}
Failed: ${report.totals.failed}
Retrying: ${report.totals.retrying}
Suppressed: ${report.totals.suppressed}

Overall status: ${report.totals.overallStatus}

---

## ACTION REQUIRED

${actions}
`;
}

export function formatDailyReportHtml(report: ConsolidatedDailyReport): string {
  const actions =
    report.actionRequired.length === 0
      ? '<p>None — both outreach systems are operating normally.</p>'
      : `<ul>${report.actionRequired.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`;

  const sectionHtml = (section: WorkspaceDailySection) => `
    <section style="margin:0 0 28px;padding:0 0 8px;border-bottom:1px solid #e2e8f0;">
      <h2 style="margin:0 0 8px;font-size:18px;">${escapeHtml(section.label)}</h2>
      <p style="margin:0 0 12px;"><strong>Status:</strong> ${escapeHtml(section.status)}</p>
      <p style="margin:0 0 4px;"><strong>Provider:</strong> ${escapeHtml(section.provider)}</p>
      <p style="margin:0 0 12px;"><strong>Sender:</strong> ${escapeHtml(section.sender)}</p>
      <table style="border-collapse:collapse;font-size:13px;margin:0 0 12px;width:100%;">
        <tbody>
          ${[
            ['Eligible recipients found', section.eligibleRecipientsFound],
            ['Emails queued', section.emailsQueued],
            ['Emails attempted', section.emailsAttempted],
            ['Emails accepted by provider', section.emailsAcceptedByProvider],
            ['Emails delivered', section.emailsDelivered],
            ['Temporary failures', section.temporaryFailures],
            ['Permanent failures', section.permanentFailures],
            ['Retries scheduled', section.retriesScheduled],
            ['Bounces', section.bounces],
            ['Complaints', section.complaints],
            ['Unsubscribes', section.unsubscribes],
            ['Suppressed', section.suppressed],
            ['Duplicate skips', section.duplicateSkips],
          ]
            .map(
              ([k, v]) =>
                `<tr><td style="padding:3px 8px 3px 0;color:#475569;">${k}</td><td style="padding:3px 0;"><strong>${v}</strong></td></tr>`,
            )
            .join('')}
        </tbody>
      </table>
      <p style="margin:0 0 4px;"><strong>Provider allowance:</strong> ${escapeHtml(section.providerAllowance)} · <strong>Used:</strong> ${section.providerUsed} · <strong>Remaining:</strong> ${escapeHtml(section.providerRemaining)}</p>
      <p style="margin:0 0 4px;"><strong>Next reset:</strong> ${escapeHtml(section.nextReset)}</p>
      <p style="margin:0 0 4px;"><strong>Outreach scheduler last run:</strong> ${escapeHtml(section.lastSchedulerRun ?? 'n/a')}</p>
      <p style="margin:0 0 4px;"><strong>Autoheal:</strong> ${section.autohealRuns} run(s); repairs: ${escapeHtml(section.autohealRepairs.join(', ') || 'none')}</p>
      <p style="margin:0 0 12px;"><strong>Outstanding faults:</strong> ${escapeHtml(section.outstandingFaults.join('; ') || 'none')}</p>
      <h3 style="margin:0 0 8px;font-size:14px;">ACTUAL RECIPIENTS ACCEPTED BY PROVIDER</h3>
      ${renderRecipients(section)}
    </section>
  `;

  return `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;color:#0f172a;max-width:760px;line-height:1.5;">
      <h1 style="margin:0 0 4px;font-size:20px;">DAILY OUTREACH REPORT</h1>
      <p style="margin:0 0 4px;"><strong>Date:</strong> ${escapeHtml(report.date)}</p>
      <p style="margin:0 0 20px;color:#475569;font-size:13px;">
        Reporting period: ${escapeHtml(report.reportingPeriodStart)} → ${escapeHtml(report.reportingPeriodEnd)}
        (${escapeHtml(report.timezone)})
      </p>
      ${sectionHtml(report.psa)}
      ${sectionHtml(report.repuk)}
      <section style="margin:0 0 20px;">
        <h2 style="margin:0 0 8px;font-size:18px;">TOTAL ACROSS BOTH WORKSPACES</h2>
        <ul style="margin:0;padding-left:20px;">
          <li>Eligible: ${report.totals.eligible}</li>
          <li>Attempted: ${report.totals.attempted}</li>
          <li>Accepted: ${report.totals.accepted}</li>
          <li>Delivered: ${report.totals.delivered}</li>
          <li>Failed: ${report.totals.failed}</li>
          <li>Retrying: ${report.totals.retrying}</li>
          <li>Suppressed: ${report.totals.suppressed}</li>
        </ul>
        <p style="margin:12px 0 0;"><strong>Overall status:</strong> ${escapeHtml(report.totals.overallStatus)}</p>
      </section>
      <section>
        <h2 style="margin:0 0 8px;font-size:18px;">ACTION REQUIRED</h2>
        ${actions}
      </section>
      <p style="margin:24px 0 0;font-size:12px;color:#64748b;">
        <a href="https://policestationrepuk.org/admin/firm-outreach">Open outreach dashboard</a>
        · Provider-accepted = Resend message ID stored. Delivered = webhook/backfill confirmation.
      </p>
    </div>
  `;
}
