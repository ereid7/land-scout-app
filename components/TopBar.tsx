'use client';

import { UserButton } from '@neondatabase/auth/react/ui';

import ScrapeBadge from '@/components/ScrapeBadge';
import type { Stats } from '@/lib/types';

export default function TopBar({
  stats,
  count,
  loading,
  error,
}: {
  stats: Stats | null;
  count: number;
  loading: boolean;
  error: string;
}) {
  return (
    <header className="app-topbar">
      <div className="brand-block">
        <span className="brand-mark" aria-hidden="true">
          🌲
        </span>
        <div>
          <div className="brand-title">Land Scout</div>
          <div className="brand-subtitle">Next.js + Neon + Drizzle map workspace</div>
        </div>
      </div>
      <div className="topbar-stat">{stats ? `${stats.total} total listings` : 'Loading stats...'}</div>
      <div className="topbar-stat topbar-stat--accent">
        {loading ? 'Loading listings...' : `${count} shown`}
      </div>
      <div className="topbar-stat">Avg score {stats ? stats.avgScore : '...'}</div>
      <div className="topbar-stat">
        {stats?.lastRun ? `Last run ${new Date(stats.lastRun).toLocaleString()}` : 'Waiting for runs...'}
      </div>
      <ScrapeBadge />
      <UserButton size="icon" />
      {error ? <div className="topbar-stat topbar-stat--error">{error}</div> : null}
    </header>
  );
}
