import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getKV } from '@/lib/kv';

export async function saveSubmission(
  type: 'contact' | 'registration' | 'station-update' | 'lead-magnet',
  data: Record<string, unknown>,
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const id = `${type}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
  const submitted_at = new Date().toISOString();

  const record = {
    id,
    type,
    submitted_at,
    payload: data,
  };

  // Prefer KV when available (primary runtime store) — avoids anon Supabase writes.
  const kv = getKV();
  if (kv) {
    try {
      await kv.set(`submission:${id}`, record, { ex: 60 * 60 * 24 * 90 }); // 90-day retention
      return id;
    } catch (err) {
      console.error('[saveSubmission] KV write failed:', err instanceof Error ? err.message : 'unknown');
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('submissions').insert(record);
      return id;
    } catch (err) {
      console.error(
        '[saveSubmission] Supabase insert failed:',
        err instanceof Error ? err.message : 'unknown',
      );
    }
  }

  // Privacy-safe fallback — never log full PII payloads to runtime logs.
  console.info('[saveSubmission — no durable store]', { id, type, submitted_at });
  return id;
}
