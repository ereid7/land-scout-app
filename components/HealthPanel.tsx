'use client';

import { useEffect, useMemo, useState } from 'react';

import { useHealth, type ScraperHealth, type ScraperHealthStatus } from '@/hooks/useHealth';

const STATUS_LABELS: Record<ScraperHealthStatus, string> = {
  ok: 'OK',
  degraded: 'Degraded',
  down: 'Down',
  unknown: 'Unknown',
};

const STATUS_PRIORITY: Record<ScraperHealthStatus, number> = {
  down: 0,
  degraded: 1,
  unknown: 2,
  ok: 3,
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Never';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
}

function overallStatus(
  scrapers: ScraperHealth[] | undefined,
  loading: boolean,
): ScraperHealthStatus {
  if (loading && !scrapers?.length) {
    return 'unknown';
  }
  if (!scrapers?.length) {
    return 'unknown';
  }
  if (scrapers.some((scraper) => scraper.status === 'down')) {
    return 'down';
  }
  if (scrapers.some((scraper) => scraper.status === 'degraded')) {
    return 'degraded';
  }
  if (scrapers.every((scraper) => scraper.status === 'ok')) {
    return 'ok';
  }
  return 'unknown';
}

export default function HealthPanel() {
  const { data, loading } = useHealth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const status = overallStatus(data?.scrapers, loading);
  const sortedScrapers = useMemo(
    () =>
      [...(data?.scrapers ?? [])].sort(
        (left, right) =>
          STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status] || left.id.localeCompare(right.id),
      ),
    [data?.scrapers],
  );

  return (
    <>
      <button
        className={`health-trigger${open ? ' health-trigger--open' : ''}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="scraper-health-panel"
        aria-label="Toggle scraper health panel"
        title="Scraper health"
      >
        <span className={`health-dot health-dot--${status}`} aria-hidden="true" />
      </button>

      {open ? (
        <aside className="health-panel" id="scraper-health-panel" role="dialog" aria-label="Scraper health">
          <div className="health-panel__header">
            <div>
              <div className="health-panel__eyebrow">Scraper health</div>
              <div className="health-panel__title">
                {loading && !data ? 'Loading status…' : `${sortedScrapers.length} scrapers tracked`}
              </div>
            </div>
            <button
              className="icon-button health-panel__close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close scraper health panel"
            >
              ×
            </button>
          </div>

          <div className="health-panel__summary">
            <div className="health-panel__summary-card">
              <span className="health-panel__summary-label">Last scout run</span>
              <span className="health-panel__summary-value">{formatTimestamp(data?.last_scout_run ?? null)}</span>
            </div>
            <div className="health-panel__summary-card">
              <span className="health-panel__summary-label">Active listings</span>
              <span className="health-panel__summary-value">
                {typeof data?.total_active === 'number' ? data.total_active.toLocaleString() : '—'}
              </span>
            </div>
          </div>

          <div className="health-panel__body">
            {!loading && !data ? (
              <div className="health-panel__empty">Health data unavailable.</div>
            ) : (
              <table className="health-table">
                <thead>
                  <tr>
                    <th>Scraper</th>
                    <th>Last run</th>
                    <th>Found</th>
                    <th>Zeroes</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedScrapers.map((scraper) => (
                    <tr key={scraper.id}>
                      <td className="health-table__id">{scraper.id}</td>
                      <td>{formatTimestamp(scraper.last_run)}</td>
                      <td>{scraper.last_found}</td>
                      <td>{scraper.consecutive_zeros}</td>
                      <td>
                        <span className={`health-badge health-badge--${scraper.status}`}>
                          {STATUS_LABELS[scraper.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {loading && sortedScrapers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="health-panel__empty">
                        Loading scraper health…
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </div>
        </aside>
      ) : null}
    </>
  );
}
