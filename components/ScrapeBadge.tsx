'use client';

import { useEffect, useMemo, useState } from 'react';

import type { ScoutRun } from '@/lib/types';

function formatRelativeTime(value: string | null) {
  if (!value) {
    return 'No runs yet';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Run time unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function ScrapeBadge() {
  const [run, setRun] = useState<ScoutRun | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRun() {
      try {
        const response = await fetch('/api/runs?limit=1', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load runs (${response.status})`);
        }
        const payload = (await response.json()) as { runs?: ScoutRun[] };
        if (!cancelled) {
          setRun(payload.runs?.[0] ?? null);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }

    loadRun().catch(() => {});
    const intervalId = window.setInterval(() => {
      loadRun().catch(() => {});
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const status = useMemo(() => {
    if (error) {
      return { label: 'Runs unavailable', tone: 'scrape-badge--error' };
    }
    if (!run) {
      return { label: 'No scrape runs', tone: 'scrape-badge--idle' };
    }
    if (run.status === 'running') {
      return { label: 'Scrape running', tone: 'scrape-badge--running' };
    }
    if (run.status === 'error') {
      return { label: 'Last scrape failed', tone: 'scrape-badge--error' };
    }
    return { label: `Last scrape +${run.listingsNew}`, tone: 'scrape-badge--success' };
  }, [error, run]);

  return (
    <div className={`scrape-badge ${status.tone}`}>
      <span className="scrape-badge__label">{status.label}</span>
      <span className="scrape-badge__meta">{formatRelativeTime(run?.startedAt ?? null)}</span>
    </div>
  );
}
