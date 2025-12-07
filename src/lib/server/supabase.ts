import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase-types';
import { env } from '$env/dynamic/private';

let _supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const url = env.SUPABASE_URL || process.env.SUPABASE_URL;
    const key = env.SUPABASE_SECRET_API_KEY || process.env.SUPABASE_SECRET_API_KEY;

    if (!url || !key) {
      console.error('Missing Supabase credentials', {
        urlFromEnv: !!env.SUPABASE_URL,
        urlFromProcess: !!process.env.SUPABASE_URL,
        keyFromEnv: !!env.SUPABASE_SECRET_API_KEY,
        keyFromProcess: !!process.env.SUPABASE_SECRET_API_KEY
      });
      throw new Error(`Missing Supabase environment variables. URL: ${!!url}, KEY: ${!!key}`);
    }

    _supabase = createClient<Database>(url, key);
  }
  return _supabase;
}
