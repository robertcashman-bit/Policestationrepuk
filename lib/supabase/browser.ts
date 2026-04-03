import { createBrowserClient } from '@supabase/ssr';

let _warned = false;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (!_warned) {
      console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
      _warned = true;
    }
    return null;
  }
  return createBrowserClient(url, key);
}
