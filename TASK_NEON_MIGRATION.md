# Switch to Neon DB + Drizzle ORM

## Remove Supabase, install Neon + Drizzle
```bash
cd ~/Repos/land-scout-app
npm uninstall @supabase/supabase-js @supabase/ssr 2>/dev/null; true
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

## File: lib/db/schema.ts
Full Drizzle schema for listings, scout_runs, scraper_runs tables.
All columns from the existing SQLite schema (see ~/Repos/land-researcher/data/land_scout.db).
Key fields: id(text PK), source, url, title, price(numeric), acres(numeric), price_per_acre,
state, county, city, description, has_trees(bool), has_road_access(bool), has_water(bool),
owner_financing(bool), in_floodplain(bool), is_duplicate(bool), motivated_seller(bool),
enriched(bool), notified(bool), price_reduced(bool), is_down_payment(bool),
latitude(numeric), longitude(numeric), flood_zone, elevation_ft, road_distance_m,
water_distance_m, nearest_town, town_distance_m, score(int default 0),
hoa_risk(text default 'unknown'), hoa_annual_fee, hoa_flags,
original_price, full_price, price_drop_pct, owner_state, zoning, parcel_source,
assessed_value, canonical_id, source_aliases, days_on_market(int), drive_hours,
est_annual_lease, status(text default 'active'), first_seen(timestamp), last_seen(timestamp),
gone_since(timestamp), raw_data(jsonb).
Add indexes on score, state, source, status, price, first_seen.
Export: type Listing = typeof listings.$inferSelect

## File: lib/db/index.ts
```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
export { schema }
```

## File: drizzle.config.ts (root)
```typescript
import type { Config } from 'drizzle-kit'
export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
```

## File: .env.local.example
```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

## File: .env.local
```
# Get your connection string from neon.tech
DATABASE_URL=postgresql://placeholder:placeholder@localhost/landscout
```

## Rewrite API routes to use Drizzle

### app/api/listings/route.ts
Use drizzle query with: eq(status,'active'), eq(isDuplicate,false), gte(score,minScore),
lte(price,maxPrice), gte(acres,minAcres), optional state/ownerFinance/noHoa/motivated filters.
Return GeoJSON FeatureCollection. For listings without coords, use STATE_CENTROIDS fallback + jitter.

STATE_CENTROIDS: Minnesota[-94.69,46.33], Wisconsin[-89.62,44.27], Iowa[-93.10,42.01],
Missouri[-91.83,37.96], Michigan[-84.56,44.31], Illinois[-89.20,40.04], Indiana[-86.13,39.77],
Ohio[-82.91,40.42], Kansas[-98.48,38.53], Nebraska[-99.90,41.49], SouthDakota[-99.44,44.30],
NorthDakota[-100.47,47.55], Kentucky[-84.27,37.84], Tennessee[-86.78,35.52],
Arkansas[-92.20,34.75], WestVirginia[-80.45,38.60], NorthCarolina[-79.02,35.76],
Georgia[-83.64,32.16], Florida[-81.52,27.66]

### app/api/stats/route.ts
Query all active non-duplicate listings for state + score. Return: total, avgScore, byState dict, lastRun.

### app/api/listings/[id]/route.ts
Single listing by id.

### app/api/runs/route.ts
Last 10 scout_runs ordered by startedAt desc.

## Remove old lib/supabase.ts and lib/supabase-server.ts
Delete these files and replace with lib/db/schema.ts + lib/db/index.ts

## Update lib/types.ts
Export Listing type from schema: `export type { Listing, ScoutRun } from './db/schema'`

## package.json scripts — add:
```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

## Migration script — scripts/migrate_to_neon.py (in land-researcher repo)
Python script using psycopg2 to read SQLite and bulk upsert to Neon.
Reads from data/land_scout.db, cleans bool fields, handles raw_data JSON.
Usage: DATABASE_URL=<url> uv run python scripts/migrate_to_neon.py

## Scraper adapter — scrapers/db_neon_adapter.py (in land-researcher repo)
NeonAdapter class with upsert_listing(dict)->bool method.
Falls back gracefully if DATABASE_URL not set.

## README.md
Clear setup guide: get Neon URL → set .env.local → npm run db:push → npm run dev

## Quality gates
1. No TypeScript errors: npm run build
2. All imports resolve correctly
3. git commit and push

## Final
openclaw system event --text "Next.js + Neon + Drizzle app complete. Set DATABASE_URL from neon.tech → npm run db:push → npm run dev at localhost:3000. Drizzle Studio: npm run db:studio" --mode now
