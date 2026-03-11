import type { Listing, ListingFeatureCollection, ListingWithLocation } from '@/lib/types';

const DEFAULT_COORDINATES: [number, number] = [-98.5795, 39.8283];

const STATE_CENTROIDS = new Map<string, [number, number]>([
  ['minnesota', [-94.69, 46.33]],
  ['wisconsin', [-89.62, 44.27]],
  ['iowa', [-93.1, 42.01]],
  ['missouri', [-91.83, 37.96]],
  ['michigan', [-84.56, 44.31]],
  ['illinois', [-89.2, 40.04]],
  ['indiana', [-86.13, 39.77]],
  ['ohio', [-82.91, 40.42]],
  ['kansas', [-98.48, 38.53]],
  ['nebraska', [-99.9, 41.49]],
  ['southdakota', [-99.44, 44.3]],
  ['northdakota', [-100.47, 47.55]],
  ['kentucky', [-84.27, 37.84]],
  ['tennessee', [-86.78, 35.52]],
  ['arkansas', [-92.2, 34.75]],
  ['westvirginia', [-80.45, 38.6]],
  ['northcarolina', [-79.02, 35.76]],
  ['georgia', [-83.64, 32.16]],
  ['florida', [-81.52, 27.66]],
]);

function normalizeStateKey(state: string | null | undefined) {
  return String(state ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function hashSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function jitterCoordinates(base: [number, number], seed: string): [number, number] {
  const hash = hashSeed(seed);
  const angle = ((hash % 360) * Math.PI) / 180;
  const radius = 0.12 + ((hash % 97) / 97) * 0.28;

  return [
    Number((base[0] + Math.cos(angle) * radius).toFixed(6)),
    Number((base[1] + Math.sin(angle) * radius).toFixed(6)),
  ];
}

function resolveCoordinates(listing: Listing): {
  coordinates: [number, number];
  has_exact_coordinates: boolean;
  location_source: ListingWithLocation['location_source'];
} {
  if (
    typeof listing.longitude === 'number' &&
    Number.isFinite(listing.longitude) &&
    typeof listing.latitude === 'number' &&
    Number.isFinite(listing.latitude)
  ) {
    return {
      coordinates: [listing.longitude, listing.latitude],
      has_exact_coordinates: true,
      location_source: 'listing',
    };
  }

  const centroid = STATE_CENTROIDS.get(normalizeStateKey(listing.state)) ?? DEFAULT_COORDINATES;
  return {
    coordinates: jitterCoordinates(centroid, listing.id),
    has_exact_coordinates: false,
    location_source: 'state_centroid',
  };
}

export function toListingWithLocation(listing: Listing): ListingWithLocation {
  const { coordinates, has_exact_coordinates, location_source } = resolveCoordinates(listing);

  return {
    ...listing,
    longitude: coordinates[0],
    latitude: coordinates[1],
    has_exact_coordinates,
    location_source,
  };
}

export function listingsToFeatureCollection(listings: Listing[]): ListingFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: listings.map((listing) => {
      const mapped = toListingWithLocation(listing);
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [mapped.longitude ?? DEFAULT_COORDINATES[0], mapped.latitude ?? DEFAULT_COORDINATES[1]],
        },
        properties: mapped,
      };
    }),
  };
}

export function normalizeFeatureCollection(payload: ListingFeatureCollection): ListingWithLocation[] {
  return (payload.features ?? []).map((feature) => ({
    ...feature.properties,
    longitude: feature.geometry?.coordinates?.[0] ?? feature.properties.longitude ?? null,
    latitude: feature.geometry?.coordinates?.[1] ?? feature.properties.latitude ?? null,
    has_exact_coordinates: feature.properties.has_exact_coordinates ?? true,
    location_source: feature.properties.location_source ?? 'listing',
  })) as ListingWithLocation[];
}

export function formatCurrency(value: number | null | undefined) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
