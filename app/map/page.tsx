'use client';

import dynamic from 'next/dynamic';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useListings } from '@/hooks/useListings';
import { useMapStore } from '@/store/mapStore';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#888',
      }}
    >
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
    >
      <ErrorBoundary>
        <div style={{ flex: 1, position: 'relative' }}>
          <MapView />
          <FilterOverlay />
        </div>
      </ErrorBoundary>
    </div>
  );
}

function FilterOverlay() {
  const { count } = useListings();
  const listOpen = useMapStore((state) => state.listOpen);
  const setListOpen = useMapStore((state) => state.setListOpen);

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        display: 'flex',
        gap: 8,
      }}
    >
      <div
        style={{
          background: 'rgba(20,20,20,0.95)',
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {count} deals
      </div>
      <button
        type="button"
        onClick={() => setListOpen(!listOpen)}
        style={{
          background: 'rgba(20,20,20,0.95)',
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 13,
          color: '#f5f5f5',
          cursor: 'pointer',
        }}
      >
        ☰ List
      </button>
    </div>
  );
}
