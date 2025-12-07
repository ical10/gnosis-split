import { createClient } from '@supabase/supabase-js';
import { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import type { Database } from '$lib/supabase-types';

let _supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!_supabase) {
    // Use public env vars (baked in at build time)
    const supabaseUrl = VITE_SUPABASE_URL;
    const supabaseKey = VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        `Missing Supabase env vars. URL: ${!!supabaseUrl}, KEY: ${!!supabaseKey}. ` +
        `Make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.`
      );
    }

    _supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false } // Server-side: no auth persistence
    });
  }
  return _supabase;
}
