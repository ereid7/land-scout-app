# Land Scout App

Next.js 14 map workspace for scouting land listings, backed by Neon Postgres and Drizzle ORM.

## Setup

1. Create a database at `neon.tech`.
2. Copy `.env.local.example` to `.env.local`.
3. Set `DATABASE_URL` from Neon.
4. Install dependencies with `npm install`.
5. Push the schema with `npm run db:push`.
6. Start the app with `npm run dev`.

The app runs at `http://localhost:3000` and redirects to `/map`.

## Environment

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require

# Optional: trigger a remote scrape worker from the sidebar button
SCRAPE_WEBHOOK_URL=https://example.com/land-scout/run
SCRAPE_WEBHOOK_BEARER_TOKEN=
SCRAPE_WEBHOOK_SECRET=
```

## Database Commands

```bash
npm run db:generate
npm run db:push
npm run db:studio
```

## API Routes

- `GET /api/listings`
- `GET /api/listings/:id`
- `GET /api/stats`
- `GET /api/runs`
- `POST /api/scrape`

## Data Migration

To migrate the existing SQLite data into Neon:

```bash
cd /Users/erai/Repos/land-researcher
DATABASE_URL=postgresql://... uv run python scripts/migrate_to_neon.py
```

## Notes

- Listings without exact coordinates are mapped with deterministic state-centroid fallback pins.
- The app returns empty data until `DATABASE_URL` is set.
