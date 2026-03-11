const PLACEHOLDER_SUPABASE_URL = 'https://your-project.supabase.co';
const PLACEHOLDER_SUPABASE_ANON_KEY = 'your-anon-key';
const PLACEHOLDER_SUPABASE_SERVICE_KEY = 'your-service-role-key';
const PLACEHOLDER_SCRAPE_WEBHOOK_URL = 'https://your-scrape-webhook.example.com';
const PLACEHOLDER_SCRAPE_WEBHOOK_TOKEN = 'your-optional-shared-secret';

function hasRealValue(value: string | undefined, placeholder: string): value is string {
  return Boolean(value && value.trim() && value !== placeholder);
}

export function getBrowserSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? PLACEHOLDER_SUPABASE_ANON_KEY,
  };
}

export function getServerSupabaseEnv() {
  return {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      PLACEHOLDER_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY ?? PLACEHOLDER_SUPABASE_SERVICE_KEY,
  };
}

export function hasBrowserSupabaseEnv() {
  const { url, anonKey } = getBrowserSupabaseEnv();
  return hasRealValue(url, PLACEHOLDER_SUPABASE_URL) && hasRealValue(anonKey, PLACEHOLDER_SUPABASE_ANON_KEY);
}

export function hasServerSupabaseEnv() {
  const { url, serviceKey } = getServerSupabaseEnv();
  return hasRealValue(url, PLACEHOLDER_SUPABASE_URL) && hasRealValue(serviceKey, PLACEHOLDER_SUPABASE_SERVICE_KEY);
}

export function getScrapeWebhookConfig() {
  return {
    url: process.env.SCRAPE_WEBHOOK_URL ?? PLACEHOLDER_SCRAPE_WEBHOOK_URL,
    token: process.env.SCRAPE_WEBHOOK_TOKEN ?? PLACEHOLDER_SCRAPE_WEBHOOK_TOKEN,
  };
}

export function hasScrapeWebhook() {
  const { url } = getScrapeWebhookConfig();
  return hasRealValue(url, PLACEHOLDER_SCRAPE_WEBHOOK_URL);
}
