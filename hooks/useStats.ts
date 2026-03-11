'use client';

import { useEffect, useState } from 'react';

import type { Stats } from '@/lib/types';

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      const response = await fetch('/api/stats', { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Failed to load stats (${response.status})`);
      }
      const payload = (await response.json()) as Stats;
      setStats(payload);
    }

    loadStats().catch(() => {});

    return () => controller.abort();
  }, []);

  return stats;
}
