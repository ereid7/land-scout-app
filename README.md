# Land Scout App

Next.js 14 map workspace for scouting land listings, backed by Postgres (Neon or local) and Drizzle ORM.

## Local Development

### Option A: Local Postgres (no Neon account needed)

```bash
docker-compose up -d          # start local postgres
cp .env.local.example .env.local
npm install
npm run db:push               # create schema
npm run dev                   # start Next.js at localhost:3000
```

### Option B: Neon (cloud)

1. Create a project at [neon.tech](https://neon.tech)
2. (Optional) Enable Neon Auth
3. Copy `.env.local.example` to `.env.local`
4. Set `DATABASE_URL` (and `NEON_AUTH_*` if using auth) from the Neon dashboard

```bash
npm install
npm run db:push
npm run dev
```

## Migrate SQLite Data

```bash
cd ~/Repos/land-researcher
# Local postgres:
DATABASE_URL=postgresql://land_scout:land_scout@localhost:5432/land_scout uv run python scripts/migrate_to_neon.py
# Or Neon:
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require uv run python scripts/migrate_to_neon.py
```

## Environment

See `.env.local.example` for all variables.

## Database Commands

```bash
npm run db:generate   # generate migration SQL from schema changes
npm run db:push       # push schema directly (dev)
npm run db:studio     # open Drizzle Studio GUI
```

## API Routes

- `GET /api/listings`
- `GET /api/listings/:id`
- `GET /api/stats`
- `GET /api/runs`
- `POST /api/scrape`

## Notes

- Listings without exact coordinates use deterministic state-centroid fallback pins.
- The `lib/db/index.ts` auto-detects Neon vs local Postgres from `DATABASE_URL`.
- The app returns empty data until `DATABASE_URL` is configured.
