import { NextResponse } from 'next/server';

import { getScrapeWebhookConfig, hasScrapeWebhook } from '@/lib/env';

export async function POST(request: Request) {
  if (!hasScrapeWebhook()) {
    return NextResponse.json(
      {
        error: 'SCRAPE_WEBHOOK_URL is not configured',
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const { url, token } = getScrapeWebhookConfig();

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && token !== 'your-optional-shared-secret'
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      body: JSON.stringify({
        source: 'land-scout-app',
        triggered_at: new Date().toISOString(),
        payload: body,
      }),
      cache: 'no-store',
    });

    const text = await upstream.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    return NextResponse.json(
      {
        ok: upstream.ok,
        status: upstream.status,
        response: parsed,
      },
      { status: upstream.ok ? 202 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown scrape trigger error',
      },
      { status: 502 },
    );
  }
}
