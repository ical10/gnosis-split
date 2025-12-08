import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import type { Database } from '$lib/supabase-types';

let _supabase: SupabaseClient<Database> | undefined;

export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    // Use public env vars (baked in at build time)
    const supabaseUrl = PUBLIC_SUPABASE_URL;
    const supabaseKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        `Missing Supabase env vars. URL: ${!!supabaseUrl}, KEY: ${!!supabaseKey}. ` +
        `Make sure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.`
      );
    }

    _supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false } // Server-side: no auth persistence
    });
  }
  return _supabase;
}
