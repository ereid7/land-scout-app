import { createBrowserClient } from '@supabase/ssr';

import { getBrowserSupabaseEnv } from '@/lib/env';
import type { Database } from '@/lib/types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getBrowserSupabaseEnv();
  browserClient = createBrowserClient<Database>(url, anonKey);
  return browserClient;
}
