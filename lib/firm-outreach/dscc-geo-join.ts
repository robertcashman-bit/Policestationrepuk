import { normalizeFirmName } from './normalize';
import type { RawProspectInput } from './merge-prospects';

export type FirmGeo = { county?: string; postcode?: string; town?: string };

/** Map normalizeFirmName(firm) → best-known county/postcode from geo-bearing sources. */
export function buildFirmGeoMap(inputs: RawProspectInput[]): Map<string, FirmGeo> {
  const map = new Map<string, FirmGeo>();
  for (const input of inputs) {
    const key = normalizeFirmName(input.firmName);
    if (!key) continue;
    const county = input.county?.trim() || undefined;
    const postcode = input.postcode?.trim() || undefined;
    const town = input.town?.trim() || undefined;
    if (!county && !postcode) continue;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, { county, postcode, town });
      continue;
    }
    map.set(key, {
      county: cur.county || county,
      postcode: cur.postcode || postcode,
      town: cur.town || town,
    });
  }
  return map;
}

/**
 * Copy county/postcode/town onto DSCC (or other geo-less) rows that match a
 * firm name already present in LAA/archive/directory inputs.
 */
export function applyFirmGeoToInputs(
  inputs: RawProspectInput[],
  geoMap: Map<string, FirmGeo>,
): RawProspectInput[] {
  return inputs.map((input) => {
    if (input.county?.trim() || input.postcode?.trim()) return input;
    const geo = geoMap.get(normalizeFirmName(input.firmName));
    if (!geo) return input;
    return {
      ...input,
      county: geo.county ?? input.county,
      postcode: geo.postcode ?? input.postcode,
      town: geo.town ?? input.town,
    };
  });
}
