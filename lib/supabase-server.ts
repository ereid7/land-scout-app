import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { getServerSupabaseEnv, hasServerSupabaseEnv } from '@/lib/env';
import type { Database } from '@/lib/types';

export function createClient() {
  const { url, serviceKey } = getServerSupabaseEnv();

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isSupabaseConfigured() {
  return hasServerSupabaseEnv();
}
