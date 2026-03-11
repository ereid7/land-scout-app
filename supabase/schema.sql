create extension if not exists postgis;
create extension if not exists pgcrypto;

create table if not exists listings (
  id text primary key,
  source text not null,
  url text not null,
  title text,
  price numeric(12,2),
  acres numeric(10,2),
  price_per_acre numeric(12,2),
  state text,
  county text,
  city text,
  description text,
  has_trees boolean default false,
  has_road_access boolean default false,
  has_water boolean default false,
  owner_financing boolean default false,
  in_floodplain boolean default false,
  is_duplicate boolean default false,
  is_down_payment boolean default false,
  price_reduced boolean default false,
  motivated_seller boolean default false,
  latitude double precision,
  longitude double precision,
  flood_zone text,
  elevation_ft numeric(8,1),
  road_distance_m numeric(10,1),
  water_distance_m numeric(10,1),
  nearest_town text,
  town_distance_m numeric(10,1),
  score integer default 0,
  hoa_risk text default 'unknown' check (hoa_risk in ('none','low','medium','high','unknown')),
  hoa_annual_fee numeric(10,2),
  hoa_flags text,
  original_price numeric(12,2),
  full_price numeric(12,2),
  price_drop_pct numeric(5,2),
  owner_state text,
  zoning text,
  parcel_source text,
  assessed_value numeric(12,2),
  canonical_id text,
  source_aliases text,
  days_on_market integer default 0,
  drive_hours numeric(5,2),
  est_annual_lease numeric(10,2),
  enriched boolean default false,
  notified boolean default false,
  status text default 'active' check (status in ('active','stale','gone','duplicate')),
  first_seen timestamptz default now(),
  last_seen timestamptz default now(),
  gone_since timestamptz,
  raw_data jsonb
);

create index if not exists idx_listings_score on listings(score desc);
create index if not exists idx_listings_state on listings(state);
create index if not exists idx_listings_source on listings(source);
create index if not exists idx_listings_status on listings(status);
create index if not exists idx_listings_hoa_risk on listings(hoa_risk);
create index if not exists idx_listings_price on listings(price);
create index if not exists idx_listings_first_seen on listings(first_seen desc);
create index if not exists idx_listings_geo on listings using gist (
  st_setsrid(st_makepoint(longitude, latitude), 4326)
) where latitude is not null and longitude is not null;

alter table listings enable row level security;

drop policy if exists listings_public_read on listings;
create policy listings_public_read on listings for select using (true);

drop policy if exists listings_service_write on listings;
create policy listings_service_write on listings for all using (auth.role() = 'service_role');

create table if not exists scout_runs (
  id uuid primary key default gen_random_uuid(),
  run_id text unique not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text default 'running' check (status in ('running','complete','error')),
  scrapers_run integer default 0,
  scrapers_ok integer default 0,
  scrapers_errored integer default 0,
  scrapers_zero integer default 0,
  listings_found integer default 0,
  listings_new integer default 0,
  listings_deduped integer default 0,
  listings_stale integer default 0,
  config_snapshot jsonb,
  error_log text
);

create table if not exists scraper_runs (
  id uuid primary key default gen_random_uuid(),
  scout_run_id text references scout_runs(run_id),
  scraper_id text not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  listings_found integer default 0,
  listings_new integer default 0,
  error text,
  duration_secs numeric(8,2)
);

create index if not exists idx_scraper_runs_scraper on scraper_runs(scraper_id);
create index if not exists idx_scraper_runs_scout on scraper_runs(scout_run_id);

create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  filters jsonb not null,
  notify boolean default false,
  created_at timestamptz default now()
);

alter table saved_searches enable row level security;

drop policy if exists saved_searches_owner on saved_searches;
create policy saved_searches_owner on saved_searches using (auth.uid() = user_id);
