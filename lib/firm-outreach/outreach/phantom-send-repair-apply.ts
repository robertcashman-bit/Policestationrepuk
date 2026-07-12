import { isProviderAcceptedMessageId } from '@robertcashman/firm-outreach-core';
import { getKV } from '@/lib/kv';
import { dailySendKeyForCampaignId } from '../campaign-scope';
import { OUTREACH_CAMPAIGN_IDS } from '../site-config';
import {
  deleteSendRecord,
  getDailySendCount,
  getProspect,
  listAllSends,
  saveProspect,
} from '../storage';
import type { FirmOutreachSend } from '../types';
import {
  countRealSendsByDayCampaign,
  isPhantomSend,
  reconcileProspectAfterPhantomRemoval,
} from './phantom-send-repair';

export interface PhantomSendRepairResult {
  phantomCount: number;
  phantomsRemoved: number;
  prospectsReconciled: number;
  dailyCapsFixed: number;
  byCampaign: Record<string, number>;
}

export async function applyPhantomSendRepair(opts?: {
  campaignId?: string;
  recountDailyCaps?: boolean;
}): Promise<PhantomSendRepairResult> {
  const campaignFilter = opts?.campaignId?.trim() || undefined;
  const allSends = await listAllSends();
  let phantoms = allSends.filter(isPhantomSend);
  if (campaignFilter) {
    phantoms = phantoms.filter((s) => s.campaignId === campaignFilter);
  }

  const byCampaign: Record<string, number> = {};
  for (const s of phantoms) {
    byCampaign[s.campaignId] = (byCampaign[s.campaignId] ?? 0) + 1;
  }

  const sendsAfterDelete = allSends.filter((s) => !phantoms.some((p) => p.id === s.id));
  const affectedProspectIds = [...new Set(phantoms.map((s) => s.prospectId))];
  let prospectsReconciled = 0;

  for (const prospectId of affectedProspectIds) {
    const prospect = await getProspect(prospectId);
    if (!prospect) continue;
    if (campaignFilter && prospect.campaignId !== campaignFilter) continue;
    const remaining = sendsAfterDelete.filter((s) => s.prospectId === prospectId);
    const next = reconcileProspectAfterPhantomRemoval(prospect, remaining);
    if (next) {
      await saveProspect(next, prospect.status);
      prospectsReconciled++;
    }
  }

  for (const phantom of phantoms) {
    await deleteSendRecord(phantom);
  }

  let dailyCapsFixed = 0;
  if (opts?.recountDailyCaps !== false) {
    const kv = getKV();
    if (kv) {
      const realCounts = countRealSendsByDayCampaign(
        sendsAfterDelete.filter((s) => !campaignFilter || s.campaignId === campaignFilter),
      );
      const campaigns = campaignFilter ? [campaignFilter] : [...OUTREACH_CAMPAIGN_IDS];
      const phantomDays = new Set(
        phantoms
          .map((s) => `${s.campaignId}:${s.sentAt?.slice(0, 10) ?? ''}`)
          .filter((k) => !k.endsWith(':')),
      );

      for (const [key, count] of realCounts) {
        const [campaignId, date] = key.split(':');
        if (!campaigns.includes(campaignId)) continue;
        await kv.set(dailySendKeyForCampaignId(campaignId, date), count);
        dailyCapsFixed++;
      }

      for (const key of phantomDays) {
        if (realCounts.has(key)) continue;
        const [campaignId, date] = key.split(':');
        if (!campaigns.includes(campaignId)) continue;
        await kv.set(dailySendKeyForCampaignId(campaignId, date), 0);
        dailyCapsFixed++;
      }
    }
  }

  return {
    phantomCount: phantoms.length,
    phantomsRemoved: phantoms.length,
    prospectsReconciled,
    dailyCapsFixed,
    byCampaign,
  };
}

export interface DailyCapDrift {
  campaignId: string;
  date: string;
  counterValue: number;
  realCount: number;
}

export async function findDailyCapDrift(
  sends: FirmOutreachSend[],
  date: string,
): Promise<DailyCapDrift[]> {
  const realCounts = countRealSendsByDayCampaign(sends);
  const drifts: DailyCapDrift[] = [];

  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    const counterValue = await getDailySendCount(date, campaignId);
    const realCount = realCounts.get(`${campaignId}:${date}`) ?? 0;
    if (counterValue !== realCount) {
      drifts.push({ campaignId, date, counterValue, realCount });
    }
  }

  return drifts;
}

export async function fixDailyCapDrift(
  sends: FirmOutreachSend[],
  date: string,
): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;

  const drifts = await findDailyCapDrift(sends, date);
  for (const drift of drifts) {
    await kv.set(dailySendKeyForCampaignId(drift.campaignId, drift.date), drift.realCount);
  }
  return drifts.length;
}

export function countRealSendsOnDate(
  sends: FirmOutreachSend[],
  date: string,
  campaignId?: string,
): number {
  return sends.filter(
    (s) =>
      s.sentAt?.startsWith(date) &&
      isProviderAcceptedMessageId(s.resendMessageId) &&
      (!campaignId || s.campaignId === campaignId),
  ).length;
}
