# Land Scout App

Next.js 14 land intelligence app backed by Neon Postgres, Drizzle ORM, and Neon Auth.

## Stack

- Next.js 14 + TypeScript
- Neon Postgres
- Drizzle ORM + Drizzle Kit
- Neon Auth UI
- MapLibre GL

## Setup

1. Create a Neon project at `neon.tech`.
2. Enable Neon Auth in the Neon console.
3. Copy `.env.local.example` to `.env.local`.
4. Fill in:

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
NEON_AUTH_BASE_URL=https://ep-xxx.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=replace-with-a-32-character-secret-value
```

5. Install dependencies:

```bash
npm install
```

6. Push the schema:

```bash
npm run db:push
```

7. Start the app:

```bash
npm run dev
```

The app runs at `http://localhost:3000` and redirects to `/map`.

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
- `GET|POST|PUT|DELETE|PATCH /api/auth/[...path]`
- `GET|POST|DELETE /api/saved-searches`

## Data Migration

To migrate the existing SQLite data into Neon:

```bash
cd /Users/erai/Repos/land-researcher
DATABASE_URL=postgresql://... uv run python scripts/migrate_to_neon.py
```

## Notes

- The auth API route proxies to Neon Auth and uses signed cookies, so `NEON_AUTH_COOKIE_SECRET` must be at least 32 characters.
- Listings without exact coordinates are still mapped using deterministic state-centroid fallback pins.
