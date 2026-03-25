import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function saveSubmission(type: 'contact' | 'registration', data: Record<string, unknown>): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const id = `${type}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;

  const record = {
    id,
    type,
    submitted_at: new Date().toISOString(),
    payload: data,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('submissions').insert(record);
    } catch (err) {
      console.error('[saveSubmission] Supabase insert failed, falling back to log:', err);
      console.info('[saveSubmission]', JSON.stringify(record));
    }
  } else {
    console.info('[saveSubmission — no DB]', JSON.stringify(record));
  }

  return id;
}
