import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

const numericColumn = (name: string) => numeric(name, { mode: 'number' });
const timestampColumn = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const listings = pgTable(
  'listings',
  {
    id: text('id').primaryKey(),
    source: text('source').notNull(),
    url: text('url').notNull(),
    title: text('title'),
    price: numericColumn('price'),
    acres: numericColumn('acres'),
    price_per_acre: numericColumn('price_per_acre'),
    state: text('state'),
    county: text('county'),
    city: text('city'),
    description: text('description'),
    has_trees: boolean('has_trees').default(false).notNull(),
    has_road_access: boolean('has_road_access').default(false).notNull(),
    has_water: boolean('has_water').default(false).notNull(),
    owner_financing: boolean('owner_financing').default(false).notNull(),
    in_floodplain: boolean('in_floodplain').default(false).notNull(),
    is_duplicate: boolean('is_duplicate').default(false).notNull(),
    motivated_seller: boolean('motivated_seller').default(false).notNull(),
    enriched: boolean('enriched').default(false).notNull(),
    notified: boolean('notified').default(false).notNull(),
    price_reduced: boolean('price_reduced').default(false).notNull(),
    is_down_payment: boolean('is_down_payment').default(false).notNull(),
    latitude: numericColumn('latitude'),
    longitude: numericColumn('longitude'),
    flood_zone: text('flood_zone'),
    elevation_ft: numericColumn('elevation_ft'),
    road_distance_m: numericColumn('road_distance_m'),
    water_distance_m: numericColumn('water_distance_m'),
    nearest_town: text('nearest_town'),
    town_distance_m: numericColumn('town_distance_m'),
    score: integer('score').default(0).notNull(),
    hoa_risk: text('hoa_risk').default('unknown').notNull(),
    hoa_annual_fee: numericColumn('hoa_annual_fee'),
    hoa_flags: text('hoa_flags'),
    original_price: numericColumn('original_price'),
    full_price: numericColumn('full_price'),
    price_drop_pct: numericColumn('price_drop_pct'),
    owner_state: text('owner_state'),
    zoning: text('zoning'),
    parcel_source: text('parcel_source'),
    assessed_value: numericColumn('assessed_value'),
    canonical_id: text('canonical_id'),
    source_aliases: text('source_aliases'),
    days_on_market: integer('days_on_market').default(0).notNull(),
    drive_hours: numericColumn('drive_hours'),
    est_annual_lease: numericColumn('est_annual_lease'),
    status: text('status').default('active').notNull(),
    first_seen: timestampColumn('first_seen'),
    last_seen: timestampColumn('last_seen'),
    gone_since: timestampColumn('gone_since'),
    raw_data: jsonb('raw_data'),
  },
  (table) => [
    index('listings_score_idx').on(table.score),
    index('listings_state_idx').on(table.state),
    index('listings_source_idx').on(table.source),
    index('listings_status_idx').on(table.status),
    index('listings_price_idx').on(table.price),
    index('listings_first_seen_idx').on(table.first_seen),
  ],
);

export const scoutRuns = pgTable(
  'scout_runs',
  {
    id: text('id').primaryKey(),
    run_id: text('run_id').notNull(),
    started_at: timestampColumn('started_at'),
    finished_at: timestampColumn('finished_at'),
    status: text('status').default('running').notNull(),
    scrapers_run: integer('scrapers_run').default(0).notNull(),
    scrapers_ok: integer('scrapers_ok').default(0).notNull(),
    scrapers_errored: integer('scrapers_errored').default(0).notNull(),
    scrapers_zero: integer('scrapers_zero').default(0).notNull(),
    listings_found: integer('listings_found').default(0).notNull(),
    listings_new: integer('listings_new').default(0).notNull(),
    listings_deduped: integer('listings_deduped').default(0).notNull(),
    listings_stale: integer('listings_stale').default(0).notNull(),
    config_snapshot: jsonb('config_snapshot'),
    error_log: text('error_log'),
  },
  (table) => [
    uniqueIndex('scout_runs_run_id_idx').on(table.run_id),
    index('scout_runs_started_at_idx').on(table.started_at),
  ],
);

export const scraperRuns = pgTable(
  'scraper_runs',
  {
    id: text('id').primaryKey(),
    scout_run_id: text('scout_run_id').references(() => scoutRuns.run_id, {
      onDelete: 'set null',
    }),
    scraper_id: text('scraper_id').notNull(),
    started_at: timestampColumn('started_at'),
    finished_at: timestampColumn('finished_at'),
    listings_found: integer('listings_found').default(0).notNull(),
    listings_new: integer('listings_new').default(0).notNull(),
    error: text('error'),
    duration_secs: numericColumn('duration_secs'),
  },
  (table) => [
    index('scraper_runs_scout_run_id_idx').on(table.scout_run_id),
    index('scraper_runs_scraper_id_idx').on(table.scraper_id),
    index('scraper_runs_started_at_idx').on(table.started_at),
  ],
);

export type Listing = typeof listings.$inferSelect;
export type ScoutRun = typeof scoutRuns.$inferSelect;
export type ScraperRun = typeof scraperRuns.$inferSelect;
