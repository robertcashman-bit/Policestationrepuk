import type { PoliceStation } from '@/lib/types';
import { isDialablePhone } from '@/lib/station-phone-dialable';
import { getApprovedCache } from './storage';
import type { ApprovedContactField } from './types';

/**
 * Merge admin/AI-approved discovery numbers onto stations at request time.
 * Custody desk numbers overlay `custodyPhone`; station/enquiry numbers overlay `phone`.
 */
export async function applyApprovedDiscoveryNumbers(
  stations: PoliceStation[],
): Promise<PoliceStation[]> {
  const approved = await getApprovedCache();
  if (approved.size === 0) return stations;

  return stations.map((s) => {
    const record = approved.get(s.id);
    if (!record?.publicVisible) return s;

    const number = record.phoneNumber.trim();
    if (!isDialablePhone(number)) return s;

    const verificationStatus = record.verificationStatus ?? 'unverified';
    const contactField: ApprovedContactField = record.contactField ?? 'custodyPhone';
    const notes =
      verificationStatus === 'verified'
        ? `Admin-approved discovery (${record.approvedAt.slice(0, 10)})`
        : `Admin-approved discovery — unverified pending confirmation (${record.approvedAt.slice(0, 10)})`;

    const fieldMeta = {
      status: verificationStatus,
      sourceUrl: record.sourceUrl || undefined,
      notes,
    };

    return {
      ...s,
      ...(contactField === 'phone' ? { phone: number } : { custodyPhone: number }),
      verificationMeta: {
        ...(s.verificationMeta ?? {}),
        fields: {
          ...(s.verificationMeta?.fields ?? {}),
          [contactField]: fieldMeta,
        },
        custodyDiscovery: {
          status: verificationStatus,
          sourceFindingId: record.sourceFindingId,
          sourceUrl: record.sourceUrl,
          approvedAt: record.approvedAt,
          approvedBy: record.approvedBy,
          source: 'autonomous_discovery' as const,
          contactField,
          publicationStatus: record.publicationStatus,
        },
      },
    };
  });
}
