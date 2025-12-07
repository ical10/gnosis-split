import { createClient } from '@supabase/supabase-js';
import { PRIVATE_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { Database } from '$lib/supabase-types';

let _supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = PRIVATE_SUPABASE_URL;
    const supabaseKey = PRIVATE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        `Missing Supabase env vars. URL: ${!!supabaseUrl}, KEY: ${!!supabaseKey}. ` +
        `Make sure PRIVATE_SUPABASE_URL and PRIVATE_SUPABASE_SERVICE_ROLE_KEY are set in Netlify.`
      );
    }

    _supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false } // Server-side: no auth persistence
    });
  }
  return _supabase;
}
