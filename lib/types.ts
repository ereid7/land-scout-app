import type {
  Listing as DatabaseListing,
  SavedSearch as DatabaseSavedSearch,
  ScoutRun as DatabaseScoutRun,
  ScraperRun as DatabaseScraperRun,
} from './db/schema';

export type Listing = DatabaseListing;
export type SavedSearch = DatabaseSavedSearch;
export type ScoutRun = DatabaseScoutRun;
export type ScraperRun = DatabaseScraperRun;

export type LocationSource = 'listing' | 'state_centroid';
export type ListingBbox = [number, number, number, number];

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
