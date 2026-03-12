'use client';

import { useEffect, useState } from 'react';

import type { ListingBrief } from '@/lib/brief';

export function useBrief(listingId: string | null) {
  const [brief, setBrief] = useState<ListingBrief | null>(null);
  const [loading, setLoading] = useState(Boolean(listingId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!listingId) {
      setBrief(null);
      setError('');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError('');

    fetch(`/api/listing/${listingId}/brief`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load brief (${response.status})`);
        }

        return (await response.json()) as ListingBrief;
      })
      .then((payload) => {
        setBrief(payload);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') {
          return;
        }

        setBrief(null);
        setError('Failed to load property brief');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [listingId]);

  return { brief, loading, error };
}
