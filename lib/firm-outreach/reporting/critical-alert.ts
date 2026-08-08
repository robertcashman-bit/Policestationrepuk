/**
 * Immediate alerts ONLY for genuinely critical failures.
 * Routine zero-send / single timeouts / cap exhaustion go to the 07:00 report.
 */
import { Resend } from 'resend';
import { claimKey } from '@/lib/kv-atomic';
import type { AutohealFault } from '../autoheal/detect';
import type { OutreachCapacity } from '../capacity';
import { operatorNotifyFromAddress } from '../outreach/from-address';
import { outreachAdminEmail } from './send-daily-report';

const CRITICAL_CODES = new Set<AutohealFault['code']>([
  'dry_run_enabled',
  'sending_disabled',
  'manual_reconciliation_required',
  'accepted_marked_failed',
  'accepted_without_provider_id',
]);

function isCriticalFault(f: AutohealFault): boolean {
  if (CRITICAL_CODES.has(f.code)) return true;
  if (f.severity !== 'critical') return false;
  const d = f.detail.toLowerCase();
  return (
    d.includes('suspended') ||
    d.includes('401') ||
    d.includes('403') ||
    d.includes('api key') ||
    d.includes('resend_api_key') ||
    d.includes('domain') ||
    d.includes('duplicate')
  );
}

/** Dedup critical alerts for 6 hours per fault signature. */
async function claimCriticalAlert(signature: string): Promise<boolean> {
  return claimKey(`firmoutreach:critical_alert:${signature}`, 6 * 60 * 60);
}

export async function maybeSendCriticalOutreachAlert(opts: {
  faults: AutohealFault[];
  capacities: { psa: OutreachCapacity; repuk: OutreachCapacity };
  runId: string;
}): Promise<boolean> {
  const critical = opts.faults.filter(isCriticalFault);
  if (critical.length === 0) return false;

  // Both workspaces unable to send despite eligible — always critical.
  const bothBlocked =
    opts.capacities.psa.eligibleUnsent > 0 &&
    opts.capacities.repuk.eligibleUnsent > 0 &&
    opts.capacities.psa.effectiveAvailableCapacity <= 0 &&
    opts.capacities.repuk.effectiveAvailableCapacity <= 0 &&
    !['no_eligible_leads', 'provider_daily_limit', 'configured_daily_limit'].includes(
      opts.capacities.psa.limitingFactor,
    ) &&
    !['no_eligible_leads', 'provider_daily_limit', 'configured_daily_limit'].includes(
      opts.capacities.repuk.limitingFactor,
    );

  if (!bothBlocked && critical.every((f) => f.code === 'http_429' || f.code === 'network_timeouts')) {
    return false;
  }

  const signature = critical
    .map((f) => f.code)
    .sort()
    .join('|')
    .slice(0, 120);
  const claimed = await claimCriticalAlert(signature || 'generic');
  if (!claimed) return false;

  const to = outreachAdminEmail();
  const key = process.env.RESEND_API_KEY?.trim();
  if (!to || !key) {
    console.error('[firm-outreach critical]', critical.map((f) => f.detail).join(' | '));
    return false;
  }

  const subject = `[Outreach CRITICAL] ${critical[0].code} — action required`;
  const body = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:720px;">
      <h2 style="margin:0 0 12px;color:#b91c1c;">Critical outreach alert</h2>
      <p style="margin:0 0 12px;">This is <strong>not</strong> the daily 07:00 report. Immediate attention required.</p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;">
        ${critical.map((f) => `<li><strong>${f.code}</strong> (${f.workspace}): ${f.detail}</li>`).join('')}
      </ul>
      <p style="margin:0;font-size:12px;color:#64748b;">Autoheal run ${opts.runId}. Ordinary retries / empty queues / daily caps are deferred to the morning report.</p>
    </div>
  `;

  try {
    const client = new Resend(key);
    await client.emails.send({
      from: operatorNotifyFromAddress(),
      to,
      subject,
      html: body,
    });
    return true;
  } catch (err) {
    console.error('[firm-outreach critical] send failed', err);
    return false;
  }
}
