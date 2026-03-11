# Land Scout App

Next.js 14 App Router dashboard for Land Scout, backed by Supabase.

## Stack

- Next.js 14 + TypeScript
- Supabase (Postgres + auth-ready client wiring)
- MapLibre GL
- App Router API routes for listings, stats, scrape runs, and scrape trigger webhooks

## Setup

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project named `land-scout`.
3. Run [supabase/schema.sql](/Users/erai/Repos/land-scout-app/supabase/schema.sql) in the Supabase SQL editor.
4. Fill `.env.local` with your project URL, anon key, and service role key.
5. Install dependencies and start the app:

```bash
npm install
npm run dev
```

## Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SCRAPE_WEBHOOK_URL=https://your-scrape-webhook.example.com
SCRAPE_WEBHOOK_TOKEN=your-optional-shared-secret
```

`SCRAPE_WEBHOOK_URL` is optional. If it is not configured, `POST /api/scrape` returns a `503`.

## Data Migration

Use the scraper repo to push existing SQLite data into Supabase:

```bash
cd /Users/erai/Repos/land-researcher
uv run python scripts/migrate_to_supabase.py
```

The migration script upserts active listings and existing scout run history.

## Build

```bash
npm run build
```
