import { NextRequest, NextResponse } from 'next/server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import type { ListingFeature, ListingRow } from '@/lib/types';

const STATE_CENTROIDS: Record<string, [number, number]> = {
  Minnesota: [-94.69, 46.33],
  Wisconsin: [-89.62, 44.27],
  Iowa: [-93.1, 42.01],
  Missouri: [-91.83, 37.96],
  Michigan: [-84.56, 44.31],
  Illinois: [-89.2, 40.04],
  Indiana: [-86.13, 39.77],
  Ohio: [-82.91, 40.42],
  Kansas: [-98.48, 38.53],
  Nebraska: [-99.9, 41.49],
  'South Dakota': [-99.44, 44.3],
  'North Dakota': [-100.47, 47.55],
  Kentucky: [-84.27, 37.84],
  Tennessee: [-86.78, 35.52],
  Arkansas: [-92.2, 34.75],
  'West Virginia': [-80.45, 38.6],
  'North Carolina': [-79.02, 35.76],
  Georgia: [-83.64, 32.16],
  Florida: [-81.52, 27.66],
};

function toFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === 0) {
    return null;
  }
  return parsed;
}

function deterministicJitter(seedText: string) {
  let hash = 0;
  for (const char of seedText) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const lon = (((hash & 0xffff) / 0xffff) - 0.5) * 1.6;
  const lat = ((((hash >> 16) & 0xffff) / 0xffff) - 0.5) * 1.0;
  return [lon, lat] as const;
}

function toFeature(listing: ListingRow): ListingFeature | null {
  let longitude = toFiniteNumber(listing.longitude);
  let latitude = toFiniteNumber(listing.latitude);
  let locationSource: 'listing' | 'state_centroid' = 'listing';

  if (longitude === null || latitude === null) {
    const centroid = STATE_CENTROIDS[listing.state];
    if (!centroid) {
      return null;
    }
    const [lonJitter, latJitter] = deterministicJitter(listing.id);
    longitude = centroid[0] + lonJitter;
    latitude = centroid[1] + latJitter;
    locationSource = 'state_centroid';
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    properties: {
      ...listing,
      location_source: locationSource,
      has_exact_coordinates: locationSource === 'listing',
    },
  };
}

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      },
    );
  }

  const { searchParams } = req.nextUrl;
  const minScore = Number.parseInt(searchParams.get('min_score') ?? '0', 10);
  const maxPrice = Number.parseInt(searchParams.get('max_price') ?? '35000', 10);
  const minAcres = Number.parseFloat(searchParams.get('min_acres') ?? '1');
  const state = searchParams.get('state') ?? '';
  const ownerFinance = searchParams.get('owner_finance') === 'true';
  const noHoa = searchParams.get('no_hoa') === 'true';
  const motivated = searchParams.get('motivated') === 'true';

  const supabase = createClient();
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .eq('is_duplicate', false)
    .gte('score', minScore)
    .lte('price', maxPrice)
    .gte('acres', minAcres)
    .order('score', { ascending: false })
    .limit(500);

  if (state) {
    query = query.eq('state', state);
  }
  if (ownerFinance) {
    query = query.eq('owner_financing', true);
  }
  if (noHoa) {
    query = query.neq('hoa_risk', 'high');
  }
  if (motivated) {
    query = query.eq('motivated_seller', true);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const features = (data ?? [])
    .map((listing) => toFeature(listing))
    .filter((feature): feature is ListingFeature => feature !== null);

  return NextResponse.json(
    { type: 'FeatureCollection', features },
    {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    },
  );
}
