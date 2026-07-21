/**
 * data.police.uk helpers — discovery only (forces / neighbourhoods).
 * Does not provide station telephone numbers; used for force identity and links.
 */

export interface DataPoliceForce {
  id: string;
  name: string;
}

export async function listDataPoliceForces(): Promise<DataPoliceForce[] | { ok: false; reason: string }> {
  try {
    const res = await fetch('https://data.police.uk/api/forces', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const data = (await res.json()) as Array<{ id?: string; name?: string }>;
    return data
      .filter((f) => f.id && f.name)
      .map((f) => ({ id: f.id!, name: f.name! }));
  } catch {
    return { ok: false, reason: 'fetch_failed' };
  }
}

export async function getDataPoliceForce(id: string): Promise<
  | { id: string; name: string; url?: string; description?: string; telephone?: string }
  | { ok: false; reason: string }
> {
  try {
    const res = await fetch(`https://data.police.uk/api/forces/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const data = (await res.json()) as {
      id?: string;
      name?: string;
      url?: string;
      description?: string;
      telephone?: string;
    };
    if (!data.id || !data.name) return { ok: false, reason: 'invalid_payload' };
    return {
      id: data.id,
      name: data.name,
      url: data.url,
      description: data.description,
      telephone: data.telephone,
    };
  } catch {
    return { ok: false, reason: 'fetch_failed' };
  }
}
