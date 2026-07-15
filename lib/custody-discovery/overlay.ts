import type { PoliceStation } from '@/lib/types';
import { isDialablePhone } from '@/lib/station-phone-dialable';
import { isGenericCustodyNumber } from './generic-numbers';
import { classifyUkNumberRange } from './number-safety';
import { getApprovedCache } from './storage';
import type { ApprovedContactField } from './types';

/**
 * Never surface 101 / force switchboards / emergency short-codes as a station
 * direct or custody desk number on the public directory.
 */
export function isPublishableOverlayNumber(
  number: string,
  forceName?: string,
  publicationStatus?: string | null,
): boolean {
  if (!isDialablePhone(number)) return false;
  if (isGenericCustodyNumber(number, forceName)) return false;
  const range = classifyUkNumberRange(number);
  if (range === 'emergency') return false;

  // Switchboard-labelled publications stay off the station phone fields;
  // they are tracked in admin / publicationStatus only.
  if (
    publicationStatus === 'verified_force_switchboard' ||
    publicationStatus === 'no_public_number_found' ||
    publicationStatus === 'station_closed' ||
    publicationStatus === 'search_failed'
  ) {
    return false;
  }

  return true;
}

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
    if (!isPublishableOverlayNumber(number, s.forceName, record.publicationStatus)) {
      return s;
    }

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
