import { NextRequest, NextResponse } from 'next/server';

import {
  hasScrapeWebhook,
  scrapeWebhookBearerToken,
  scrapeWebhookSecret,
  scrapeWebhookUrl,
} from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));

  if (!hasScrapeWebhook) {
    return NextResponse.json(
      { ok: false, error: 'SCRAPE_WEBHOOK_URL is not configured' },
      { status: 501 },
    );
  }

  const headers = new Headers({
    'content-type': 'application/json',
  });

  if (scrapeWebhookBearerToken) {
    headers.set('authorization', `Bearer ${scrapeWebhookBearerToken}`);
  }

  if (scrapeWebhookSecret) {
    headers.set('x-webhook-secret', scrapeWebhookSecret);
  }

  const response = await fetch(scrapeWebhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...payload,
      requested_at: new Date().toISOString(),
      source: 'land-scout-app',
    }),
    cache: 'no-store',
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Failed to reach scrape webhook';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  });

  if (response instanceof NextResponse) {
    return response;
  }

  const bodyText = await response.text();

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Scrape webhook returned ${response.status}`,
        body: bodyText,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    status: response.status,
    body: bodyText || null,
  });
}
