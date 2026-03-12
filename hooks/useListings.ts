'use client';

import type { Dispatch, SetStateAction } from 'react';

import useSWR from 'swr';

import { normalizeFeatureCollection } from '@/lib/listing-helpers';
import type {
  ListingBbox,
  ListingFeatureCollection,
  ListingFilters as LegacyListingFilters,
} from '@/lib/types';
import { useMapStore } from '@/store/mapStore';

type LegacyParams = {
  filters: LegacyListingFilters;
  bbox?: ListingBbox;
  setFilters?: Dispatch<SetStateAction<LegacyListingFilters>>;
};

const EMPTY_GEOJSON: ListingFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

async function fetcher(url: string): Promise<ListingFeatureCollection> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load listings (${response.status})`);
  }

  return (await response.json()) as ListingFeatureCollection;
}

export function useListings(legacy?: LegacyParams) {
  const storeFilters = useMapStore((state) => state.filters);
  const storeBbox = useMapStore((state) => state.bbox);

  const filters = legacy?.filters ?? storeFilters;
  const bbox = legacy?.bbox ?? storeBbox;
  const params = new URLSearchParams();

  if (filters.minScore > 0) {
    params.set('min_score', String(filters.minScore));
  }
  if (filters.maxPrice < 35000) {
    params.set('max_price', String(filters.maxPrice));
  }
  if (filters.minAcres > 1) {
    params.set('min_acres', String(filters.minAcres));
  }
  if (filters.state) {
    params.set('state', filters.state);
  }
  if (filters.ownerFinance) {
    params.set('owner_finance', 'true');
  }
  if (filters.noHoa) {
    params.set('no_hoa', 'true');
  }
  if ('motivated' in filters && filters.motivated) {
    params.set('motivated', 'true');
  }
  if (bbox) {
    params.set('bbox', bbox.join(','));
  }
  if (filters.driveTimeLat !== null && filters.driveTimeLng !== null) {
    params.set('drive_lat', String(filters.driveTimeLat));
    params.set('drive_lng', String(filters.driveTimeLng));
    params.set('drive_hours', String(filters.driveTimeHours));
  }

  const url = `/api/listings?${params.toString()}`;
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });

  const geojson = data ?? EMPTY_GEOJSON;
  const listings = normalizeFeatureCollection(geojson);

  return {
    geojson,
    count: geojson.features.length,
    isLoading,
    listings,
    loading: isLoading,
    error: error instanceof Error ? error.message : '',
  };
}
