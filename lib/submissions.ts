import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getKV } from '@/lib/kv';

export class SubmissionPersistError extends Error {
  constructor(message = 'No durable store accepted the submission') {
    super(message);
    this.name = 'SubmissionPersistError';
  }
}

/**
 * Persist a public-form submission. Returns the id only when KV or Supabase
 * accepted the write. Throws {@link SubmissionPersistError} when neither store
 * is available / writable — callers must not report success to the user then.
 */
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
      const { error } = await supabase.from('submissions').insert(record);
      if (error) {
        throw new Error(error.message);
      }
      return id;
    } catch (err) {
      console.error(
        '[saveSubmission] Supabase insert failed:',
        err instanceof Error ? err.message : 'unknown',
      );
    }
  }

  // Privacy-safe — never log full PII payloads. Do not pretend persistence succeeded.
  console.error('[saveSubmission — no durable store]', { id, type, submitted_at });
  throw new SubmissionPersistError();
}
