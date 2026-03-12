import type { Listing } from '@/lib/types';

type ChecklistItem = {
  item: string;
  done: boolean;
};

type ExternalLinks = {
  listing: string | null;
  countyGIS: string | null;
  femaFloodMap: string | null;
  soilSurvey: string | null;
};

type Financials = {
  askingPrice: number | null;
  pricePerAcre: number | null;
  originalPrice: number | null;
  priceDrop: number | null;
  ownerFinancing: boolean;
  estimatedAnnualTax: number | null;
};

type LandFacts = {
  acres: number | null;
  hasWater: boolean;
  hasTrees: boolean;
  hasRoadAccess: boolean;
  inFloodplain: boolean;
  floodZone: string | null;
  elevation: number | null;
  zoning: string | null;
};

type LocationFacts = {
  state: string | null;
  county: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  nearestTown: string | null;
  townDistanceMiles: string | null;
  roadDistanceFt: string | null;
  waterDistanceFt: string | null;
};

export type ListingBrief = {
  id: string;
  score: number;
  generatedAt: string;
  headline: string;
  scoreLabel: 'Strong Deal' | 'Good Value' | 'Fair' | 'Below Average';
  financials: Financials;
  land: LandFacts;
  location: LocationFacts;
  risks: string[];
  positives: string[];
  checklist: ChecklistItem[];
  externalLinks: ExternalLinks;
};

function toFiniteNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toMiles(distanceMeters: number | null | undefined) {
  const distance = toFiniteNumber(distanceMeters);
  return distance === null ? null : (distance / 1609.34).toFixed(1);
}

function toFeet(distanceMeters: number | null | undefined) {
  const distance = toFiniteNumber(distanceMeters);
  return distance === null ? null : (distance * 3.281).toFixed(0);
}

function scoreLabel(score: number) {
  if (score >= 85) {
    return 'Strong Deal' as const;
  }
  if (score >= 70) {
    return 'Good Value' as const;
  }
  if (score >= 55) {
    return 'Fair' as const;
  }
  return 'Below Average' as const;
}

function compact(values: Array<string | false | null | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

export function generateBrief(listing: Listing): ListingBrief {
  const pricePerAcre =
    toFiniteNumber(listing.price_per_acre) ??
    (toFiniteNumber(listing.price) !== null && toFiniteNumber(listing.acres)
      ? Number(((listing.price ?? 0) / (listing.acres ?? 1)).toFixed(2))
      : null);

  const askingPrice = toFiniteNumber(listing.price);
  const originalPrice = toFiniteNumber(listing.original_price);
  const assessedValue = toFiniteNumber(listing.assessed_value);
  const acres = toFiniteNumber(listing.acres);
  const latitude = toFiniteNumber(listing.latitude);
  const longitude = toFiniteNumber(listing.longitude);

  return {
    id: listing.id,
    score: listing.score,
    generatedAt: new Date().toISOString(),
    headline: `${acres?.toFixed(1) ?? '?'}ac in ${listing.county ?? listing.state ?? 'Unknown'} - ${askingPrice !== null ? `$${Math.round(askingPrice).toLocaleString('en-US')}` : '?'}`,
    scoreLabel: scoreLabel(listing.score),
    financials: {
      askingPrice,
      pricePerAcre,
      originalPrice,
      priceDrop: listing.price_reduced ? toFiniteNumber(listing.price_drop_pct) : null,
      ownerFinancing: listing.owner_financing,
      estimatedAnnualTax: assessedValue !== null ? Number((assessedValue * 0.012).toFixed(0)) : null,
    },
    land: {
      acres,
      hasWater: listing.has_water,
      hasTrees: listing.has_trees,
      hasRoadAccess: listing.has_road_access,
      inFloodplain: listing.in_floodplain,
      floodZone: listing.flood_zone,
      elevation: toFiniteNumber(listing.elevation_ft),
      zoning: listing.zoning,
    },
    location: {
      state: listing.state,
      county: listing.county,
      city: listing.city,
      lat: latitude,
      lng: longitude,
      nearestTown: listing.nearest_town,
      townDistanceMiles: toMiles(listing.town_distance_m),
      roadDistanceFt: toFeet(listing.road_distance_m),
      waterDistanceFt: toFeet(listing.water_distance_m),
    },
    risks: compact([
      listing.in_floodplain && 'In flood plain - verify FEMA zone before purchase',
      listing.hoa_risk === 'high' && 'HOA/POA detected - verify fees and restrictions',
      !listing.has_road_access && 'No confirmed road access - verify easements',
      listing.days_on_market > 180 && `Long DOM (${listing.days_on_market} days) - may have issues`,
      pricePerAcre !== null && pricePerAcre > 8000 && 'High price per acre for rural land',
    ]),
    positives: compact([
      listing.has_water && 'Water access confirmed',
      listing.has_trees && 'Timber present',
      listing.has_road_access && 'Road access confirmed',
      listing.owner_financing && 'Owner financing available',
      !listing.in_floodplain && 'Not in flood plain',
      listing.hoa_risk === 'none' && 'No HOA/POA',
      listing.price_reduced &&
        `Price reduced ${toFiniteNumber(listing.price_drop_pct)?.toFixed(0) ?? '?'}%`,
    ]),
    checklist: [
      { item: 'Verify exact boundaries with county GIS', done: false },
      { item: 'Confirm road access (legal easement vs informal)', done: !!listing.has_road_access },
      { item: 'Check FEMA flood map', done: listing.flood_zone != null },
      { item: 'Verify water rights / well potential', done: false },
      { item: 'Check zoning for intended use', done: listing.zoning != null },
      { item: 'Pull county assessor tax records', done: listing.assessed_value != null },
      { item: 'Check deed for mineral rights conveyance', done: false },
      { item: 'Verify cell/internet coverage', done: false },
    ],
    externalLinks: {
      listing: listing.url ?? null,
      countyGIS:
        listing.state && listing.county
          ? `https://www.google.com/search?q=${encodeURIComponent(`${listing.county} county ${listing.state} GIS parcel viewer`)}`
          : null,
      femaFloodMap:
        latitude !== null && longitude !== null
          ? `https://msc.fema.gov/portal/search#searchresultsanchor?query=${latitude},${longitude}`
          : null,
      soilSurvey:
        latitude !== null && longitude !== null
          ? 'https://websoilsurvey.sc.egov.usda.gov/App/WebSoilSurvey.aspx'
          : null,
    },
  };
}
