'use client';

import { useEffect, useState } from 'react';

import ListPanel from '@/components/ListPanel';
import Map from '@/components/Map';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useListings } from '@/hooks/useListings';
import { useStats } from '@/hooks/useStats';
import type { ListingFilters } from '@/lib/types';

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
  const [listOpen, setListOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { listings, loading, error } = useListings(filters);
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
        <Sidebar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          stats={stats}
        />
        <div className="map-pane">
          <Map listings={listings} selectedId={selectedId} onSelect={setSelectedId} />
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
      </div>
    </div>
  );
}
