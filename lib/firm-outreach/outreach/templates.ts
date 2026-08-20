import { SITE_URL } from '@/lib/seo-layer/config';
import { COMMUNITY_EMAIL } from '@/lib/site-navigation';
import {
  POLICESTATIONAGENT_FREE_ADVICE_HREF,
  POLICESTATIONAGENT_HOME_HREF,
  POLICESTATIONAGENT_KENT_RESOURCES_HREF,
  POLICESTATIONAGENT_NAME,
  POLICESTATIONAGENT_SITE,
} from '@/lib/policestationagent-promo';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../campaign-scope';
import type { FirmProspect } from '../types';

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildTrackedJoinUrl(prospect: FirmProspect): string {
  const path =
    prospect.prospectType === 'solicitor'
      ? `/go/whatsapp-solicitor?ref=${encodeURIComponent(prospect.id)}`
      : `/go/whatsapp-firm?ref=${encodeURIComponent(prospect.id)}`;
  return `${SITE_URL}${path}`;
}

function isAgentCoverProspect(prospect: FirmProspect): boolean {
  return prospect.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID;
}

export function subjectForStep(prospect: FirmProspect, step: number): string {
  if (isAgentCoverProspect(prospect)) {
    if (step === 0) {
      return 'Kent police station cover — agency solicitor services';
    }
    if (step === 1) {
      return `Reminder: ${POLICESTATIONAGENT_NAME} — Kent custody attendance cover`;
    }
    return 'Last note — Kent police station agency cover';
  }

  if (step === 0) {
    return prospect.prospectType === 'solicitor'
      ? 'Find freelance police station reps — PoliceStationRepUK directory'
      : 'Find freelance police station cover — PoliceStationRepUK for firms';
  }
  if (step === 1) {
    return 'Reminder: PoliceStationRepUK directory + firm WhatsApp for cover';
  }
  return 'Last note — PoliceStationRepUK directory for criminal defence firms';
}

function buildAgentCoverHtml(opts: {
  prospect: FirmProspect;
  step: number;
  unsubscribeUrl: string;
}): string {
  const { prospect, step, unsubscribeUrl } = opts;
  const firmLine = escapeHtml(prospect.firmName);
  const greeting =
    prospect.prospectType === 'solicitor' && prospect.surname
      ? `Dear ${escapeHtml([prospect.title, prospect.surname].filter(Boolean).join(' '))},`
      : 'Hello,';

  const intro =
    step === 0
      ? `<p><strong>${POLICESTATIONAGENT_NAME}</strong> provides criminal defence solicitor cover at Kent police stations — when your firm needs attendance at custody suites across the county, we can act as your agency representative.</p>
         <p>I've attached a short brochure covering stations we attend, turnaround times, and how agency cover works.</p>`
      : step === 1
        ? `<p>A quick reminder — ${POLICESTATIONAGENT_NAME} still offers Kent police station attendance cover for firms like <strong>${firmLine}</strong>.</p>`
        : `<p>Final note — if ${firmLine} ever needs Kent custody attendance cover, ${POLICESTATIONAGENT_NAME} is available for agency instructions.</p>`;

  const ctaUrl =
    step === 0 ? POLICESTATIONAGENT_FREE_ADVICE_HREF : POLICESTATIONAGENT_HOME_HREF;

  return `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;line-height:1.5">
      <p>${greeting}</p>
      ${intro}
      <ul style="margin:16px 0;padding-left:20px;line-height:1.6">
        <li>Coverage at Kent custody suites including Medway, Maidstone, Canterbury, and more</li>
        <li>Written attendance notes back within 24 hours</li>
        <li>Direct instruction — no middleman agency layer</li>
      </ul>
      <p style="margin:24px 0">
        <a href="${escapeHtml(ctaUrl)}"
           style="display:inline-block;padding:12px 22px;background:#1e3a5f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">
          View Kent police station cover
        </a>
      </p>
      <p style="font-size:14px;color:#475569">
        Resources: <a href="${POLICESTATIONAGENT_KENT_RESOURCES_HREF}">Kent custody resources</a>
      </p>
      <p style="font-size:12px;color:#64748b">Ref: ${escapeHtml(prospect.id)}</p>
      <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0" />
      <p style="font-size:12px;color:#64748b">
        Defence Legal Services Ltd · ICO ZA198500<br />
        Greenacre, London Road, West Kingsdown, Sevenoaks, Kent TN15 6ER<br />
        Reply to ${escapeHtml(COMMUNITY_EMAIL)} ·
        <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a>
      </p>
    </div>
  `;
}

/** Plain-text companion for HTML outreach (deliverability + accessibility). */
export function buildOutreachEmailText(opts: {
  prospect: FirmProspect;
  step: number;
  unsubscribeUrl: string;
}): string {
  const { prospect, step, unsubscribeUrl } = opts;
  const greeting =
    prospect.prospectType === 'solicitor' && prospect.surname
      ? `Dear ${[prospect.title, prospect.surname].filter(Boolean).join(' ')},`
      : 'Hello,';

  if (isAgentCoverProspect(prospect)) {
    const intro =
      step === 0
        ? `${POLICESTATIONAGENT_NAME} provides criminal defence solicitor cover at Kent police stations — when your firm needs attendance at custody suites across the county, we can act as your agency representative.\n\nA short brochure is attached covering stations we attend, turnaround times, and how agency cover works.`
        : step === 1
          ? `A quick reminder — ${POLICESTATIONAGENT_NAME} still offers Kent police station attendance cover for firms like ${prospect.firmName}.`
          : `Final note — if ${prospect.firmName} ever needs Kent custody attendance cover, ${POLICESTATIONAGENT_NAME} is available for agency instructions.`;
    const cta =
      step === 0 ? POLICESTATIONAGENT_FREE_ADVICE_HREF : POLICESTATIONAGENT_HOME_HREF;
    return [
      greeting,
      '',
      intro,
      '',
      '- Coverage at Kent custody suites including Medway, Maidstone, Canterbury, and more',
      '- Written attendance notes back within 24 hours',
      '- Direct instruction — no middleman agency layer',
      '',
      `View Kent police station cover: ${cta}`,
      `Resources: ${POLICESTATIONAGENT_KENT_RESOURCES_HREF}`,
      '',
      `Ref: ${prospect.id}`,
      '',
      'Defence Legal Services Ltd · ICO ZA198500',
      'Greenacre, London Road, West Kingsdown, Sevenoaks, Kent TN15 6ER',
      `Reply to ${COMMUNITY_EMAIL}`,
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join('\n');
  }

  const joinUrl = buildTrackedJoinUrl(prospect);
  const intro =
    step === 0
      ? prospect.prospectType === 'solicitor'
        ? 'PoliceStationRepUK is the free UK directory of accredited police station representatives, plus a verified WhatsApp group for cover coordinators. Browse reps by county, or post urgent custody cover when your rota needs a freelance rep.'
        : 'PoliceStationRepUK is the free UK directory of accredited police station representatives for cover coordinators, plus a verified WhatsApp group for criminal defence firms. Find freelance reps by area, or post out-of-hours custody attendance requests.'
      : step === 1
        ? `A quick reminder — PoliceStationRepUK still offers ${prospect.firmName} a free directory of accredited reps and a firm WhatsApp group for police station cover (no agency layer).`
        : `Final note — if ${prospect.firmName} ever needs freelance police station cover, the PoliceStationRepUK directory and firm WhatsApp group remain free resources for criminal defence firms across England & Wales.`;

  const benefits =
    step === 0
      ? [
          `- Browse accredited reps on the free directory: ${SITE_URL}/directory`,
          '- Post urgent custody cover when your duty rota or panel needs a rep',
          '- Hear back from accredited reps covering your stations and counties',
          '- Instruct the rep directly — no middleman fees',
          '',
        ].join('\n')
      : '';

  return [
    greeting,
    '',
    intro,
    benefits ? `\n${benefits}` : '',
    `Join the firm WhatsApp: ${joinUrl}`,
    `Directory: ${SITE_URL}/directory`,
    `Or read more: ${SITE_URL}/WhatsApp/firms`,
    '',
    `When you message us, include your firm name and SRA number if applicable. Ref: ${prospect.id}`,
    '',
    'Defence Legal Services Ltd · ICO ZA198500',
    'Greenacre, London Road, West Kingsdown, Sevenoaks, Kent TN15 6ER',
    `Reply to ${COMMUNITY_EMAIL}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');
}

export function buildOutreachEmailHtml(opts: {
  prospect: FirmProspect;
  step: number;
  unsubscribeUrl: string;
}): string {
  if (isAgentCoverProspect(opts.prospect)) {
    return buildAgentCoverHtml(opts);
  }

  const { prospect, step, unsubscribeUrl } = opts;
  const joinUrl = buildTrackedJoinUrl(prospect);
  const firmLine = escapeHtml(prospect.firmName);
  const greeting =
    prospect.prospectType === 'solicitor' && prospect.surname
      ? `Dear ${escapeHtml([prospect.title, prospect.surname].filter(Boolean).join(' '))},`
      : 'Hello,';

  const intro =
    step === 0
      ? prospect.prospectType === 'solicitor'
        ? `<p><strong>PoliceStationRepUK</strong> is the free UK directory of accredited police station representatives, plus a verified WhatsApp group for cover coordinators. Browse reps by county, or post urgent custody cover when your rota needs a freelance rep.</p>`
        : `<p><strong>PoliceStationRepUK</strong> is the free UK directory of accredited police station representatives for cover coordinators, plus a verified WhatsApp group for criminal defence firms. Find freelance reps by area, or post out-of-hours custody attendance requests.</p>`
      : step === 1
        ? `<p>A quick reminder — PoliceStationRepUK still offers <strong>${firmLine}</strong> a free directory of accredited reps and a firm WhatsApp group for police station cover (no agency layer).</p>`
        : `<p>Final note — if ${firmLine} ever needs freelance police station cover, the PoliceStationRepUK directory and firm WhatsApp group remain free resources for criminal defence firms across England &amp; Wales.</p>`;

  const benefits =
    step === 0
      ? `<ul style="margin:16px 0;padding-left:20px;line-height:1.6">
          <li>Browse accredited reps on the free <a href="${SITE_URL}/directory">rep directory</a></li>
          <li>Post urgent custody cover when your duty rota or panel needs a rep</li>
          <li>Hear back from accredited reps covering your stations and counties</li>
          <li>Instruct the rep directly — no middleman fees</li>
        </ul>`
      : '';

  const refLine = `<p style="font-size:12px;color:#64748b">When you message us, include your firm name and SRA number if applicable. Ref: ${escapeHtml(prospect.id)}</p>`;

  return `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;line-height:1.5">
      <p>${greeting}</p>
      ${intro}
      ${benefits}
      <p style="margin:24px 0">
        <a href="${escapeHtml(joinUrl)}"
           style="display:inline-block;padding:12px 22px;background:#065f46;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">
          Join firm WhatsApp
        </a>
        &nbsp;
        <a href="${SITE_URL}/directory"
           style="display:inline-block;padding:12px 22px;background:#1e3a5f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">
          Open directory
        </a>
      </p>
      <p style="font-size:14px;color:#475569">
        Or read more: <a href="${SITE_URL}/WhatsApp/firms">${SITE_URL}/WhatsApp/firms</a>
      </p>
      ${refLine}
      <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0" />
      <p style="font-size:12px;color:#64748b">
        Defence Legal Services Ltd · ICO ZA198500<br />
        Greenacre, London Road, West Kingsdown, Sevenoaks, Kent TN15 6ER<br />
        Reply to ${escapeHtml(COMMUNITY_EMAIL)} ·
        <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a>
      </p>
    </div>
  `;
}
