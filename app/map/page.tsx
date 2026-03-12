'use client';

import { useEffect, useState } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import ListPanel from '@/components/ListPanel';
import Map from '@/components/Map';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useListings } from '@/hooks/useListings';
import { useStats } from '@/hooks/useStats';
import type { ListingBbox, ListingFilters } from '@/lib/types';

const DEFAULT_FILTERS: ListingFilters = {
  minScore: 0,
  maxPrice: 35000,
  minAcres: 1,
  state: '',
  ownerFinance: false,
  noHoa: false,
  motivated: false,
};

export default function MapPage() {
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS);
  const [bbox, setBbox] = useState<ListingBbox | undefined>(undefined);
  const [listOpen, setListOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { listings, loading, error } = useListings({ ...filters, bbox });
  const stats = useStats();

  useEffect(() => {
    if (selectedId && !listings.some((listing) => listing.id === selectedId)) {
      setSelectedId(null);
    }
  }, [listings, selectedId]);

  return (
    <div className="app-shell">
      <TopBar stats={stats} count={listings.length} loading={loading} error={error} />
      <div className="app-body">
        <ErrorBoundary>
          <Sidebar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            stats={stats}
          />
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="map-pane">
            <Map
              listings={listings}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onBoundsChange={setBbox}
            />
            <button
              className="list-toggle"
              type="button"
              onClick={() => setListOpen((open) => !open)}
              aria-label={listOpen ? 'Hide listing panel' : 'Show listing panel'}
            >
              {listOpen ? '×' : 'LIST'}
            </button>
            <ListPanel
              listings={listings}
              selectedId={selectedId}
              open={listOpen}
              onSelect={setSelectedId}
              onClose={() => setListOpen(false)}
            />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
