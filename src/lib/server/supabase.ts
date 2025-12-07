import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SECRET_API_KEY } from '$env/static/private';
import type { Database } from '$lib/supabase-types';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SECRET_API_KEY
);
