const rawDatabaseUrl = process.env.DATABASE_URL?.trim() ?? '';

function isPlaceholderDatabaseUrl(value: string) {
  return (
    value.length === 0 ||
    value.includes('placeholder:placeholder') ||
    value.includes('@localhost/landscout')
  );
}

export const hasDatabaseUrl = !isPlaceholderDatabaseUrl(rawDatabaseUrl);

export const databaseUrl = hasDatabaseUrl
  ? rawDatabaseUrl
  : 'postgresql://placeholder:placeholder@localhost/landscout?sslmode=require';

export const scrapeWebhookUrl = process.env.SCRAPE_WEBHOOK_URL?.trim() ?? '';
export const scrapeWebhookBearerToken = process.env.SCRAPE_WEBHOOK_BEARER_TOKEN?.trim() ?? '';
export const scrapeWebhookSecret = process.env.SCRAPE_WEBHOOK_SECRET?.trim() ?? '';
export const hasScrapeWebhook = scrapeWebhookUrl.length > 0;
