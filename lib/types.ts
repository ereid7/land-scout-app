import type {
  Listing as DatabaseListing,
  ScoutRun as DatabaseScoutRun,
  ScraperRun as DatabaseScraperRun,
} from './db/schema';

export type Listing = DatabaseListing;
export type ScoutRun = DatabaseScoutRun;
export type ScraperRun = DatabaseScraperRun;
export type ListingRow = DatabaseListing;
export type ScoutRunStatus = DatabaseScoutRun['status'];

export type LocationSource = 'listing' | 'state_centroid';

export interface ListingWithLocation extends DatabaseListing {
  has_exact_coordinates: boolean;
  location_source: LocationSource;
}

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

export interface ListingFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: ListingWithLocation;
}

export interface ListingFeatureCollection {
  type: 'FeatureCollection';
  features: ListingFeature[];
}
