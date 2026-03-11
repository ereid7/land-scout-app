'use client';

import { useEffect, useRef, useState } from 'react';

import { normalizeFeatureCollection } from '@/lib/listings';
import type { Listing, ListingFeatureCollection, ListingFilters } from '@/lib/types';

export function useListings(filters: ListingFilters) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }

    setLoading(true);
    setError('');

    timerRef.current = window.setTimeout(() => {
      const controller = new AbortController();
      controllerRef.current = controller;

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

      fetch(`/api/listings?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to load listings (${response.status})`);
          }
          return (await response.json()) as ListingFeatureCollection;
        })
        .then((payload) => {
          if (controllerRef.current === controller) {
            setListings(normalizeFeatureCollection(payload));
          }
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') {
            return;
          }
          if (controllerRef.current === controller) {
            setListings([]);
            setError('Failed to load listings');
          }
        })
        .finally(() => {
          if (controllerRef.current === controller) {
            controllerRef.current = null;
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [
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
