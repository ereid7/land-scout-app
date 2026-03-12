'use client';

import { useEffect, useState } from 'react';

export type ScraperHealthStatus = 'ok' | 'degraded' | 'down' | 'unknown';

export interface ScraperHealth {
  id: string;
  last_run: string | null;
  last_found: number;
  consecutive_zeros: number;
  status: ScraperHealthStatus;
}

export interface HealthData {
  scrapers: ScraperHealth[];
  last_scout_run: string | null;
  total_active: number;
}

export function useHealth(pollIntervalMs = 60_000) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchHealth = () =>
      fetch('/api/health')
        .then((response) => response.json() as Promise<HealthData>)
        .then((payload) => {
          if (!cancelled) {
            setData(payload);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });

    fetchHealth();
    const id = window.setInterval(fetchHealth, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollIntervalMs]);

  return { data, loading };
}
