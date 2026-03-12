export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

import { getDriveTimeArea, normalizeDriveTimeHours } from '@/lib/drive-time';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const hours = normalizeDriveTimeHours(Number(searchParams.get('hours')), 2);
  const city = searchParams.get('city')?.trim() ?? '';

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    if (!city) {
      return NextResponse.json({ error: 'lat/lng or city required' }, { status: 400 });
    }

    const geocoded = await geocodeCity(city);
    if (!geocoded) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    return NextResponse.json(getDriveTimeResponse(geocoded.lat, geocoded.lng, hours));
  }

  return NextResponse.json(getDriveTimeResponse(lat, lng, hours));
}

async function geocodeCity(city: string) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', city);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'us');

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'land-scout-app/1.0',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Array<{ lat: string; lon: string }>;
  const first = data[0];
  if (!first) {
    return null;
  }

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
  };
}

function getDriveTimeResponse(lat: number, lng: number, hours: number) {
  const area = getDriveTimeArea(lat, lng, hours);

  return {
    center: area.center,
    hours: area.hours,
    radiusMiles: area.radiusMiles,
    bbox: area.bbox,
  };
}
