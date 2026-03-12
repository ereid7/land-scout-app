'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';

import { normalizeFeatureCollection } from '@/lib/listing-helpers';
import type {
  ListingBbox,
  ListingFeatureCollection,
  ListingFilters,
  ListingWithLocation,
} from '@/lib/types';

type UseListingsParams = {
  filters: ListingFilters;
  bbox?: ListingBbox;
  setFilters?: Dispatch<SetStateAction<ListingFilters>>;
};

type IsochroneResponse = {
  center: {
    lat: number;
    lng: number;
  };
};

export function useListings({ filters, bbox, setFilters }: UseListingsParams) {
  const [listings, setListings] = useState<ListingWithLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listingsTimerRef = useRef<number | null>(null);
  const listingsControllerRef = useRef<AbortController | null>(null);
  const geocodeTimerRef = useRef<number | null>(null);
  const geocodeControllerRef = useRef<AbortController | null>(null);
  const bboxKey = bbox?.join(',') ?? '';

  useEffect(() => {
    const city = filters.driveTimeCity.trim();

    if (geocodeTimerRef.current) {
      window.clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = null;
    }

    if (geocodeControllerRef.current) {
      geocodeControllerRef.current.abort();
      geocodeControllerRef.current = null;
    }

    if (!city) {
      setFilters?.((current) => {
        if (current.driveTimeLat === null && current.driveTimeLng === null) {
          return current;
        }

        return {
          ...current,
          driveTimeLat: null,
          driveTimeLng: null,
        };
      });

      return undefined;
    }

    geocodeTimerRef.current = window.setTimeout(() => {
      const controller = new AbortController();
      geocodeControllerRef.current = controller;

      const params = new URLSearchParams({
        city,
        hours: String(filters.driveTimeHours),
      });

      fetch(`/api/isochrone?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to geocode drive-time city (${response.status})`);
          }

          return (await response.json()) as IsochroneResponse;
        })
        .then((payload) => {
          if (geocodeControllerRef.current !== controller) {
            return;
          }

          setFilters?.((current) => {
            if (
              current.driveTimeLat === payload.center.lat &&
              current.driveTimeLng === payload.center.lng
            ) {
              return current;
            }

            return {
              ...current,
              driveTimeLat: payload.center.lat,
              driveTimeLng: payload.center.lng,
            };
          });
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError' || geocodeControllerRef.current !== controller) {
            return;
          }

          setFilters?.((current) => {
            if (current.driveTimeLat === null && current.driveTimeLng === null) {
              return current;
            }

            return {
              ...current,
              driveTimeLat: null,
              driveTimeLng: null,
            };
          });
        })
        .finally(() => {
          if (geocodeControllerRef.current === controller) {
            geocodeControllerRef.current = null;
          }
        });
    }, 800);

    return () => {
      if (geocodeTimerRef.current) {
        window.clearTimeout(geocodeTimerRef.current);
        geocodeTimerRef.current = null;
      }

      if (geocodeControllerRef.current) {
        geocodeControllerRef.current.abort();
        geocodeControllerRef.current = null;
      }
    };
  }, [filters.driveTimeCity, filters.driveTimeHours, setFilters]);

  useEffect(() => {
    if (listingsTimerRef.current) {
      window.clearTimeout(listingsTimerRef.current);
    }

    if (listingsControllerRef.current) {
      listingsControllerRef.current.abort();
      listingsControllerRef.current = null;
    }

    setLoading(true);
    setError('');

    listingsTimerRef.current = window.setTimeout(() => {
      const controller = new AbortController();
      listingsControllerRef.current = controller;

      const params = new URLSearchParams({
        min_score: String(filters.minScore),
        max_price: String(filters.maxPrice),
        min_acres: String(filters.minAcres),
      });

      if (filters.state) {
        params.set('state', filters.state);
      }
      if (filters.ownerFinance) {
        params.set('owner_finance', 'true');
      }
      if (filters.noHoa) {
        params.set('no_hoa', 'true');
      }
      if (filters.motivated) {
        params.set('motivated', 'true');
      }
      if (bboxKey) {
        params.set('bbox', bboxKey);
      }
      if (filters.driveTimeLat !== null && filters.driveTimeLng !== null) {
        params.set('drive_lat', String(filters.driveTimeLat));
        params.set('drive_lng', String(filters.driveTimeLng));
        params.set('drive_hours', String(filters.driveTimeHours));
      }

      fetch(`/api/listings?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to load listings (${response.status})`);
          }
          return (await response.json()) as ListingFeatureCollection;
        })
        .then((payload) => {
          if (listingsControllerRef.current === controller) {
            setListings(normalizeFeatureCollection(payload));
          }
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') {
            return;
          }
          if (listingsControllerRef.current === controller) {
            setListings([]);
            setError('Failed to load listings');
          }
        })
        .finally(() => {
          if (listingsControllerRef.current === controller) {
            listingsControllerRef.current = null;
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      if (listingsTimerRef.current) {
        window.clearTimeout(listingsTimerRef.current);
        listingsTimerRef.current = null;
      }

      if (listingsControllerRef.current) {
        listingsControllerRef.current.abort();
        listingsControllerRef.current = null;
      }
    };
  }, [
    bboxKey,
    filters.driveTimeHours,
    filters.driveTimeLat,
    filters.driveTimeLng,
    filters.maxPrice,
    filters.minAcres,
    filters.minScore,
    filters.motivated,
    filters.noHoa,
    filters.ownerFinance,
    filters.state,
  ]);

  return { listings, loading, error };
}
