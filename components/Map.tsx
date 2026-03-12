'use client';

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { FeatureCollection, GeoJsonProperties, Point } from 'geojson';

import { renderPopupMarkup } from '@/components/ListingPopup';
import type { ListingBbox, ListingWithLocation } from '@/lib/types';

const STADIA_KEY = process.env.NEXT_PUBLIC_STADIA_API_KEY;
const MAP_STYLE = STADIA_KEY
  ? `https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=${STADIA_KEY}`
  : 'https://tiles.stadiamaps.com/styles/alidade_smooth.json';
type MapLibreModule = typeof import('maplibre-gl');
type MapInstance = import('maplibre-gl').Map;
type PopupInstance = import('maplibre-gl').Popup;
type GeoJSONSource = import('maplibre-gl').GeoJSONSource;
type MapGeoJSONFeature = import('maplibre-gl').MapGeoJSONFeature;
type FeatureCollectionData = FeatureCollection<Point, GeoJsonProperties>;
const EMPTY_COLLECTION: FeatureCollectionData = {
  type: 'FeatureCollection',
  features: [],
};

function toFeatureCollection(listings: ListingWithLocation[]): FeatureCollectionData {
  return {
    type: 'FeatureCollection' as const,
    features: listings
      .filter(
        (listing) =>
          Number.isFinite(listing.longitude) &&
          listing.longitude !== null &&
          Number.isFinite(listing.latitude) &&
          listing.latitude !== null,
      )
      .map((listing) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [listing.longitude as number, listing.latitude as number] as [number, number],
        },
        properties: listing as unknown as GeoJsonProperties,
      })),
  };
}

function setSourceData(map: MapInstance, sourceId: string, data: FeatureCollectionData) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(data);
}

function getBoundsTuple(map: MapInstance): ListingBbox {
  const bounds = map.getBounds();
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
}

function updateSelectedSource(map: MapInstance, listing: ListingWithLocation | null) {
  if (
    !listing ||
    !Number.isFinite(listing.longitude) ||
    listing.longitude === null ||
    !Number.isFinite(listing.latitude) ||
    listing.latitude === null
  ) {
    setSourceData(map, 'selected-listing', EMPTY_COLLECTION);
    return;
  }

  setSourceData(map, 'selected-listing', {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [listing.longitude, listing.latitude],
        },
        properties: { id: listing.id } as GeoJsonProperties,
      },
    ],
  });
}

function ensureLayers(
  map: MapInstance,
  maplibregl: MapLibreModule,
  onSelect: (listingId: string | null) => void,
  popupRef: MutableRefObject<PopupInstance | null>,
  listingsRef: MutableRefObject<ListingWithLocation[]>,
) {
  if (!map.getSource('listings')) {
    map.addSource('listings', {
      type: 'geojson',
      data: EMPTY_COLLECTION,
      cluster: true,
      clusterMaxZoom: 9,
      clusterRadius: 50,
      clusterProperties: {
        maxScore: ['max', ['get', 'score']],
      },
    });
  }

  if (!map.getSource('selected-listing')) {
    map.addSource('selected-listing', {
      type: 'geojson',
      data: EMPTY_COLLECTION,
    });
  }

  if (!map.getLayer('clusters')) {
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'listings',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'case',
          ['>=', ['get', 'maxScore'], 90],
          '#2e7d32',
          ['>=', ['get', 'maxScore'], 75],
          '#f9a825',
          ['>=', ['get', 'maxScore'], 60],
          '#e65100',
          '#b71c1c',
        ],
        'circle-opacity': 0.82,
        'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 28],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
  }

  if (!map.getLayer('cluster-count')) {
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'listings',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });
  }

  if (!map.getLayer('points')) {
    map.addLayer({
      id: 'points',
      type: 'circle',
      source: 'listings',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'case',
          ['>=', ['get', 'score'], 90],
          '#2e7d32',
          ['>=', ['get', 'score'], 75],
          '#f9a825',
          ['>=', ['get', 'score'], 60],
          '#e65100',
          '#b71c1c',
        ],
        'circle-radius': [
          'case',
          ['>=', ['get', 'score'], 90],
          12,
          ['>=', ['get', 'score'], 75],
          10,
          ['>=', ['get', 'score'], 60],
          8,
          6,
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.4,
        'circle-opacity': 0.9,
      },
    });
  }

  if (!map.getLayer('selected-point')) {
    map.addLayer({
      id: 'selected-point',
      type: 'circle',
      source: 'selected-listing',
      paint: {
        'circle-radius': 18,
        'circle-color': 'rgba(255,255,255,0.18)',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
  }

  const openPopup = (listing: ListingWithLocation, coordinates: [number, number]) => {
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({
      maxWidth: '290px',
      offset: 10,
      closeButton: false,
    })
      .setLngLat(coordinates)
      .setHTML(renderPopupMarkup(listing))
      .addTo(map);
  };

  const mapWithFlag = map as MapInstance & { __landScoutHandlersBound?: boolean };
  if (mapWithFlag.__landScoutHandlersBound) {
    return;
  }

  map.on('mouseenter', 'points', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'points', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('click', 'points', (event) => {
    const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
    if (!feature) {
      return;
    }

    const listingId = String((feature.properties as { id?: string } | undefined)?.id ?? '');
    const listing = listingsRef.current.find((candidate) => candidate.id === listingId);
    if (!listing) {
      return;
    }

    const coordinates = (((feature.geometry as unknown) as { coordinates: [number, number] }).coordinates ?? [
      listing.longitude,
      listing.latitude,
    ]) as [number, number];
    openPopup(listing, coordinates);
    onSelect(listingId);
  });

  map.on('click', 'clusters', (event) => {
    const cluster = map.queryRenderedFeatures(event.point, {
      layers: ['clusters'],
    })[0] as MapGeoJSONFeature | undefined;

    if (!cluster) {
      return;
    }

    const source = map.getSource('listings') as GeoJSONSource & {
      getClusterExpansionZoom: (
        clusterId: number,
        callback: (error: Error | null, zoom: number) => void,
      ) => void;
    };

    source.getClusterExpansionZoom(Number(cluster.properties?.cluster_id), (error, zoom) => {
      if (!error) {
        map.easeTo({
          center: ((cluster.geometry as unknown) as { coordinates: [number, number] }).coordinates,
          zoom,
        });
      }
    });
  });

  mapWithFlag.__landScoutHandlersBound = true;
}

export default function Map({
  listings,
  selectedId,
  onSelect,
  onBoundsChange,
}: {
  listings: ListingWithLocation[];
  selectedId: string | null;
  onSelect: (listingId: string | null) => void;
  onBoundsChange?: (bounds: ListingBbox) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const maplibreRef = useRef<MapLibreModule | null>(null);
  const popupRef = useRef<PopupInstance | null>(null);
  const listingsRef = useRef(listings);
  const selectedIdRef = useRef(selectedId);

  listingsRef.current = listings;
  selectedIdRef.current = selectedId;

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function initMap() {
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !containerRef.current) {
        return;
      }

      maplibreRef.current = maplibregl;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [-89.5, 38.5],
        zoom: 4,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current = map;

      resizeObserver = new ResizeObserver(() => {
        map.resize();
      });
      resizeObserver.observe(containerRef.current);

      const emitBounds = () => {
        onBoundsChange?.(getBoundsTuple(map));
      };

      map.on('load', () => {
        ensureLayers(map, maplibregl, onSelect, popupRef, listingsRef);
        setSourceData(map, 'listings', toFeatureCollection(listingsRef.current));
        const selectedListing =
          listingsRef.current.find((listing) => listing.id === selectedIdRef.current) ?? null;
        updateSelectedSource(map, selectedListing);
        emitBounds();
      });

      map.on('move', emitBounds);
    }

    initMap().catch(() => {});

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      popupRef.current?.remove();
      popupRef.current = null;
      maplibreRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getSource('listings')) {
      return;
    }

    setSourceData(map, 'listings', toFeatureCollection(listings));
  }, [listings]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const maplibregl = maplibreRef.current;
    if (!maplibregl) {
      return;
    }
    const listing = listings.find((candidate) => candidate.id === selectedId) ?? null;
    updateSelectedSource(map, listing);

    if (!listing) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

    if (
      !Number.isFinite(listing.longitude) ||
      listing.longitude === null ||
      !Number.isFinite(listing.latitude) ||
      listing.latitude === null
    ) {
      return;
    }

    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({
      maxWidth: '290px',
      offset: 10,
      closeButton: false,
    })
      .setLngLat([listing.longitude, listing.latitude])
      .setHTML(renderPopupMarkup(listing))
      .addTo(map);

    map.easeTo({
      center: [listing.longitude, listing.latitude],
      duration: 600,
      essential: true,
    });
  }, [listings, selectedId]);

  return <div ref={containerRef} className="map-canvas" />;
}
