export type HoaRisk = 'none' | 'low' | 'medium' | 'high' | 'unknown';
export type ListingStatus = 'active' | 'stale' | 'gone' | 'duplicate';
export type ScoutRunStatus = 'running' | 'complete' | 'error';
export type LocationSource = 'listing' | 'state_centroid';

export interface Listing {
  id: string;
  source: string;
  url: string;
  title: string | null;
  price: number;
  acres: number;
  price_per_acre: number | null;
  state: string;
  county: string | null;
  city: string | null;
  description: string | null;
  has_trees: boolean;
  has_road_access: boolean;
  has_water: boolean;
  owner_financing: boolean;
  in_floodplain: boolean;
  is_duplicate: boolean;
  is_down_payment: boolean;
  price_reduced: boolean;
  motivated_seller: boolean;
  latitude: number | null;
  longitude: number | null;
  flood_zone: string | null;
  elevation_ft: number | null;
  road_distance_m: number | null;
  water_distance_m: number | null;
  nearest_town: string | null;
  town_distance_m: number | null;
  score: number;
  hoa_risk: HoaRisk;
  hoa_annual_fee: number | null;
  hoa_flags: string | null;
  original_price: number | null;
  full_price: number | null;
  price_drop_pct: number | null;
  owner_state: string | null;
  zoning: string | null;
  parcel_source: string | null;
  assessed_value: number | null;
  canonical_id: string | null;
  source_aliases: string | null;
  days_on_market: number;
  drive_hours: number | null;
  est_annual_lease: number | null;
  enriched: boolean;
  notified: boolean;
  status: ListingStatus;
  first_seen: string;
  last_seen: string;
  gone_since: string | null;
  raw_data: Record<string, unknown> | null;
  has_exact_coordinates: boolean;
  location_source: LocationSource;
}

export type ListingRow = Omit<Listing, 'has_exact_coordinates' | 'location_source'>;

export interface ListingFilters {
  minScore: number;
  maxPrice: number;
  minAcres: number;
  state: string;
  ownerFinance: boolean;
  noHoa: boolean;
  motivated: boolean;
}

export interface Stats {
  total: number;
  avgScore: number;
  byState: Record<string, number>;
  lastRun: string | null;
  newToday: number;
  lastRunStatus: ScoutRunStatus | null;
}

export interface ScoutRun {
  id: string;
  run_id: string;
  started_at: string;
  finished_at: string | null;
  status: ScoutRunStatus;
  scrapers_run: number;
  scrapers_ok: number;
  scrapers_errored: number;
  scrapers_zero: number;
  listings_found: number;
  listings_new: number;
  listings_deduped: number;
  listings_stale: number;
  config_snapshot: Record<string, unknown> | null;
  error_log: string | null;
}

export interface ScraperRun {
  id: string;
  scout_run_id: string | null;
  scraper_id: string;
  started_at: string;
  finished_at: string | null;
  listings_found: number;
  listings_new: number;
  error: string | null;
  duration_secs: number | null;
}

export interface SavedSearch {
  id: string;
  user_id: string | null;
  name: string;
  filters: Record<string, unknown>;
  notify: boolean;
  created_at: string;
}

export interface ListingFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Partial<ListingRow> & Record<string, unknown>;
}

export interface ListingFeatureCollection {
  type: 'FeatureCollection';
  features: ListingFeature[];
}

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: ListingRow;
        Insert: Partial<ListingRow> & Pick<ListingRow, 'id' | 'source' | 'url'>;
        Update: Partial<ListingRow>;
      };
      scout_runs: {
        Row: ScoutRun;
        Insert: Partial<ScoutRun> & Pick<ScoutRun, 'run_id'>;
        Update: Partial<ScoutRun>;
      };
      scraper_runs: {
        Row: ScraperRun;
        Insert: Partial<ScraperRun> & Pick<ScraperRun, 'scraper_id'>;
        Update: Partial<ScraperRun>;
      };
      saved_searches: {
        Row: SavedSearch;
        Insert: Partial<SavedSearch> & Pick<SavedSearch, 'name' | 'filters'>;
        Update: Partial<SavedSearch>;
      };
    };
  };
}
