'use client';

import { useCallback, useRef, useState } from 'react';

import type { Point } from 'geojson';
import type { GeoJSONSource, MapGeoJSONFeature } from 'maplibre-gl';
import Map, {
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';

import { useListings } from '@/hooks/useListings';
import { useMapStore } from '@/store/mapStore';

import 'maplibre-gl/dist/maplibre-gl.css';

const STADIA_KEY = process.env.NEXT_PUBLIC_STADIA_API_KEY;
const MAP_STYLE = STADIA_KEY
  ? `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${STADIA_KEY}`
  : 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';

type PopupState = {
  lng: number;
  lat: number;
  props: Record<string, unknown>;
};

function getFeaturePoint(feature: MapGeoJSONFeature): [number, number] | null {
  if (feature.geometry.type !== 'Point') {
    return null;
  }

  const geometry = feature.geometry as Point;
  return geometry.coordinates as [number, number];
}

function getNumericProperty(
  properties: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const value = properties?.[key];
  return typeof value === 'number' ? value : null;
}

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const { geojson, isLoading } = useListings();
  const setBbox = useMapStore((state) => state.setBbox);
  const setSelectedId = useMapStore((state) => state.setSelectedId);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const onMoveEnd = useCallback(
    (event: ViewStateChangeEvent) => {
      const bounds = event.target.getBounds();
      setBbox([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
    },
    [setBbox],
  );

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];

      if (!feature) {
        setPopup(null);
        return;
      }

      if (feature.layer.id === 'clusters') {
        const clusterId = getNumericProperty(feature.properties, 'cluster_id');
        const coordinates = getFeaturePoint(feature);
        const source = mapRef.current?.getSource('listings') as GeoJSONSource | undefined;

        if (clusterId === null || !coordinates || !source) {
          return;
        }

        // Cast to any because maplibre-gl types don't include callback signature
        (source as any).getClusterExpansionZoom(clusterId, (error: unknown, zoom: number) => {
          if (error || !mapRef.current) {
            return;
          }

          mapRef.current.easeTo({ center: coordinates, zoom });
        });

        return;
      }

      const coordinates = getFeaturePoint(feature);
      if (!coordinates) {
        setPopup(null);
        return;
      }

      const [lng, lat] = coordinates;
      const properties = feature.properties ?? {};
      const id = typeof properties.id === 'string' ? properties.id : null;

      setPopup({ lng, lat, props: properties });
      setSelectedId(id);
    },
    [setSelectedId],
  );

  const popupScore = getNumericProperty(popup?.props, 'score') ?? 0;
  const popupPrice = getNumericProperty(popup?.props, 'price');
  const popupAcres = getNumericProperty(popup?.props, 'acres');
  const popupId = typeof popup?.props.id === 'string' ? popup.props.id : null;
  const popupState = typeof popup?.props.state === 'string' ? popup.props.state : '';
  const popupCounty = typeof popup?.props.county === 'string' ? popup.props.county : '';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading ? (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'rgba(20,20,20,0.9)',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            color: '#888',
          }}
        >
          Loading…
        </div>
      ) : null}
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: -90, latitude: 40, zoom: 4.5 }}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={['clusters', 'unclustered']}
        onClick={onClick}
        onMoveEnd={onMoveEnd}
      >
        <NavigationControl position="bottom-right" />
        <Source
          id="listings"
          type="geojson"
          data={geojson}
          cluster
          clusterMaxZoom={11}
          clusterRadius={40}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': ['step', ['get', 'point_count'], '#22c55e', 10, '#84cc16', 50, '#f59e0b'],
              'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
              'circle-opacity': 0.85,
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{ 'text-field': '{point_count_abbreviated}', 'text-size': 13 }}
            paint={{ 'text-color': '#000' }}
          />
          <Layer
            id="unclustered"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': ['step', ['get', 'score'], '#6b7280', 60, '#f59e0b', 75, '#84cc16', 90, '#22c55e'],
              'circle-radius': 7,
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#fff',
              'circle-opacity': 0.9,
            }}
          />
        </Source>
        {popup ? (
          <Popup
            longitude={popup.lng}
            latitude={popup.lat}
            anchor="bottom"
            onClose={() => setPopup(null)}
            maxWidth="260px"
          >
            <div
              style={{
                background: '#141414',
                color: '#f5f5f5',
                padding: 12,
                borderRadius: 8,
                minWidth: 200,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    background: popupScore >= 85 ? '#22c55e' : '#f59e0b',
                    color: '#000',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  ⭐ {popupScore}
                </span>
                <span style={{ fontSize: 11, color: '#888' }}>{popupState}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {popupPrice === null ? 'Price unavailable' : `$${popupPrice.toLocaleString()}`}
              </div>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                {popupAcres === null ? 'Acreage unavailable' : `${popupAcres.toFixed(1)} ac`}
                {popupCounty ? ` · ${popupCounty}` : ''}
              </div>
              {popupId ? (
                <a
                  href={`/listing/${popupId}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    background: '#22c55e',
                    color: '#000',
                    padding: '6px 0',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  View Brief →
                </a>
              ) : null}
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
