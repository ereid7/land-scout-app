import { NextRequest } from 'next/server';

import type { ListingBrief } from '@/lib/brief';
import type { Listing } from '@/lib/types';
import { createListing } from '@/tests/factories';

const { queryState, queryBuilder, mockDb } = vi.hoisted(() => {
  const queryState = {
    rows: [] as Listing[],
  };

  const queryBuilder = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  };

  queryBuilder.from.mockImplementation(() => queryBuilder);
  queryBuilder.where.mockImplementation(() => queryBuilder);
  queryBuilder.limit.mockImplementation((limit: number) => Promise.resolve(queryState.rows.slice(0, limit)));

  const mockDb = {
    select: vi.fn(() => queryBuilder),
  };

  return { queryState, queryBuilder, mockDb };
});

vi.mock('@/lib/db', async () => {
  const schema = await import('@/lib/db/schema');
  return { db: mockDb, schema };
});

import { GET } from '@/app/api/listing/[id]/brief/route';

describe('GET /api/listing/[id]/brief', () => {
  beforeEach(() => {
    queryState.rows = [];
    mockDb.select.mockClear();
    queryBuilder.from.mockClear();
    queryBuilder.where.mockClear();
    queryBuilder.limit.mockClear();
  });

  it('returns generated brief JSON for a known listing', async () => {
    queryState.rows = [
      createListing({
        id: 'brief-1',
        acres: 12.5,
        price: 25000,
        price_per_acre: null,
        county: 'Shannon',
        state: 'Missouri',
        score: 88,
        has_water: true,
        has_trees: true,
        has_road_access: true,
        owner_financing: true,
        price_reduced: true,
        price_drop_pct: 11,
        nearest_town: 'Eminence',
        town_distance_m: 8046.7,
        road_distance_m: 120,
        water_distance_m: 90,
        flood_zone: 'X',
        assessed_value: 18000,
        zoning: 'Agricultural',
        latitude: 37.15,
        longitude: -91.37,
      }),
    ];

    const response = await GET(new NextRequest('http://localhost/api/listing/brief-1/brief'), {
      params: Promise.resolve({ id: 'brief-1' }),
    });
    const payload = (await response.json()) as ListingBrief;

    expect(response.status).toBe(200);
    expect(payload.id).toBe('brief-1');
    expect(payload.scoreLabel).toBe('Strong Deal');
    expect(payload.headline).toContain('12.5ac in Shannon');
    expect(payload.financials.pricePerAcre).toBe(2000);
    expect(payload.financials.estimatedAnnualTax).toBe(216);
    expect(payload.location.townDistanceMiles).toBe('5.0');
    expect(payload.location.roadDistanceFt).toBe('394');
    expect(payload.positives).toContain('Water access confirmed');
    expect(payload.risks).toEqual([]);
    expect(payload.externalLinks.femaFloodMap).toContain('37.15,-91.37');
  });

  it('returns a 404 when the listing does not exist', async () => {
    const response = await GET(new NextRequest('http://localhost/api/listing/missing/brief'), {
      params: Promise.resolve({ id: 'missing' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Not found' });
  });
});
