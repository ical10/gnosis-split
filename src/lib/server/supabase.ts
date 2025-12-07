import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase-types';
import { env } from '$env/dynamic/private';

let _supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      env.SUPABASE_URL || '',
      env.SUPABASE_SECRET_API_KEY || ''
    );
  }
  return _supabase;
}
