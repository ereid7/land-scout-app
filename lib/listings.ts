import type { Listing, ListingFeatureCollection, ListingRow } from '@/lib/types';

export function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  }
  return false;
}

export function toNumber(value: unknown, fallback: number | null = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringOrNull(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value);
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

export function normalizeListing(value: Partial<ListingRow> & Record<string, unknown>): Listing {
  return {
    id: String(value.id ?? ''),
    source: String(value.source ?? ''),
    url: String(value.url ?? ''),
    title: toStringOrNull(value.title),
    price: toNumber(value.price, 0) ?? 0,
    acres: toNumber(value.acres, 0) ?? 0,
    price_per_acre: toNumber(value.price_per_acre, null),
    state: String(value.state ?? ''),
    county: toStringOrNull(value.county),
    city: toStringOrNull(value.city),
    description: toStringOrNull(value.description),
    has_trees: toBoolean(value.has_trees),
    has_road_access: toBoolean(value.has_road_access),
    has_water: toBoolean(value.has_water),
    owner_financing: toBoolean(value.owner_financing),
    in_floodplain: toBoolean(value.in_floodplain),
    is_duplicate: toBoolean(value.is_duplicate),
    is_down_payment: toBoolean(value.is_down_payment),
    price_reduced: toBoolean(value.price_reduced),
    motivated_seller: toBoolean(value.motivated_seller),
    latitude: toNumber(value.latitude, null),
    longitude: toNumber(value.longitude, null),
    flood_zone: toStringOrNull(value.flood_zone),
    elevation_ft: toNumber(value.elevation_ft, null),
    road_distance_m: toNumber(value.road_distance_m, null),
    water_distance_m: toNumber(value.water_distance_m, null),
    nearest_town: toStringOrNull(value.nearest_town),
    town_distance_m: toNumber(value.town_distance_m, null),
    score: toNumber(value.score, 0) ?? 0,
    hoa_risk: (value.hoa_risk as Listing['hoa_risk']) ?? 'unknown',
    hoa_annual_fee: toNumber(value.hoa_annual_fee, null),
    hoa_flags: toStringOrNull(value.hoa_flags),
    original_price: toNumber(value.original_price, null),
    full_price: toNumber(value.full_price, null),
    price_drop_pct: toNumber(value.price_drop_pct, null),
    owner_state: toStringOrNull(value.owner_state),
    zoning: toStringOrNull(value.zoning),
    parcel_source: toStringOrNull(value.parcel_source),
    assessed_value: toNumber(value.assessed_value, null),
    canonical_id: toStringOrNull(value.canonical_id),
    source_aliases: toStringOrNull(value.source_aliases),
    days_on_market: toNumber(value.days_on_market, 0) ?? 0,
    drive_hours: toNumber(value.drive_hours, null),
    est_annual_lease: toNumber(value.est_annual_lease, null),
    enriched: toBoolean(value.enriched),
    notified: toBoolean(value.notified),
    status: (value.status as Listing['status']) ?? 'active',
    first_seen: String(value.first_seen ?? ''),
    last_seen: String(value.last_seen ?? ''),
    gone_since: toStringOrNull(value.gone_since),
    raw_data:
      value.raw_data && typeof value.raw_data === 'object'
        ? (value.raw_data as Record<string, unknown>)
        : null,
    has_exact_coordinates: toBoolean(value.has_exact_coordinates),
    location_source: (value.location_source as Listing['location_source']) ?? 'listing',
  };
}

export function normalizeFeatureCollection(payload: ListingFeatureCollection): Listing[] {
  return (payload.features ?? []).map((feature) => {
    const [longitude, latitude] = feature.geometry?.coordinates ?? [null, null];
    return normalizeListing({
      ...feature.properties,
      latitude,
      longitude,
    });
  });
}
