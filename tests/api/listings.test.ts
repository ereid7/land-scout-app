import { PgDialect } from 'drizzle-orm/pg-core';
import { NextRequest } from 'next/server';

import type { Listing, ListingFeatureCollection } from '@/lib/types';
import { createListing } from '@/tests/factories';

type QuerySnapshot = {
  sql: string;
  params: unknown[];
};

function extractParam(snapshot: QuerySnapshot | null, pattern: RegExp) {
  if (!snapshot) {
    return undefined;
  }

  const match = snapshot.sql.match(pattern);
  if (!match) {
    return undefined;
  }

  return snapshot.params[Number(match[1]) - 1];
}

function extractParams(snapshot: QuerySnapshot | null, pattern: RegExp) {
  if (!snapshot) {
    return [];
  }

  return Array.from(snapshot.sql.matchAll(pattern)).map((match) => snapshot.params[Number(match[1]) - 1]);
}

function extractHoaRiskParams(snapshot: QuerySnapshot | null) {
  if (!snapshot) {
    return [];
  }

  return Array.from(snapshot.sql.matchAll(/"listings"\."hoa_risk" = \$(\d+)/g)).map((match) =>
    String(snapshot.params[Number(match[1]) - 1]),
  );
}

function applyQuery(rows: Listing[], snapshot: QuerySnapshot | null, limit: number) {
  const filtered = rows.filter((row) => {
    const status = extractParam(snapshot, /"listings"\."status" = \$(\d+)/);
    if (status !== undefined && row.status !== status) {
      return false;
    }

    const isDuplicate = extractParam(snapshot, /"listings"\."is_duplicate" = \$(\d+)/);
    if (isDuplicate !== undefined && row.is_duplicate !== isDuplicate) {
      return false;
    }

    const minScore = extractParam(snapshot, /"listings"\."score" >= \$(\d+)/);
    if (typeof minScore === 'number' && row.score < minScore) {
      return false;
    }

    const maxPrice = extractParam(snapshot, /"listings"\."price" <= \$(\d+)/);
    if (typeof maxPrice === 'number' && (row.price === null || row.price > maxPrice)) {
      return false;
    }

    const minAcres = extractParam(snapshot, /"listings"\."acres" >= \$(\d+)/);
    if (typeof minAcres === 'number' && (row.acres === null || row.acres < minAcres)) {
      return false;
    }

    const state = extractParam(snapshot, /"listings"\."state" = \$(\d+)/);
    if (typeof state === 'string' && row.state !== state) {
      return false;
    }

    const ownerFinance = extractParam(snapshot, /"listings"\."owner_financing" = \$(\d+)/);
    if (typeof ownerFinance === 'boolean' && row.owner_financing !== ownerFinance) {
      return false;
    }

    const motivated = extractParam(snapshot, /"listings"\."motivated_seller" = \$(\d+)/);
    if (typeof motivated === 'boolean' && row.motivated_seller !== motivated) {
      return false;
    }

    const minLongitude = extractParam(snapshot, /"listings"\."longitude" >= \$(\d+)/);
    if (minLongitude !== undefined && (row.longitude === null || Number(row.longitude) < Number(minLongitude))) {
      return false;
    }

    const maxLongitude = extractParam(snapshot, /"listings"\."longitude" <= \$(\d+)/);
    if (maxLongitude !== undefined && (row.longitude === null || Number(row.longitude) > Number(maxLongitude))) {
      return false;
    }

    const minLatitude = extractParam(snapshot, /"listings"\."latitude" >= \$(\d+)/);
    if (minLatitude !== undefined && (row.latitude === null || Number(row.latitude) < Number(minLatitude))) {
      return false;
    }

    const maxLatitude = extractParam(snapshot, /"listings"\."latitude" <= \$(\d+)/);
    if (maxLatitude !== undefined && (row.latitude === null || Number(row.latitude) > Number(maxLatitude))) {
      return false;
    }

    if (snapshot?.sql.includes('"listings"."hoa_risk" is null')) {
      const allowedHoaRisks = extractHoaRiskParams(snapshot);
      if (row.hoa_risk !== null && !allowedHoaRisks.includes(row.hoa_risk)) {
        return false;
      }
    }

    return true;
  });

  return filtered
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY);
    })
    .slice(0, limit);
}

const { queryState, queryBuilder, mockDb } = vi.hoisted(() => {
  const queryState = {
    rows: [] as unknown[],
    lastWhere: null as QuerySnapshot | null,
    lastLimit: null as number | null,
  };
  let dialect: PgDialect | null = null;
  const queryBuilder = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };

  queryBuilder.from.mockImplementation(() => queryBuilder);
  queryBuilder.where.mockImplementation((condition: unknown) => {
    dialect ??= new PgDialect();
    queryState.lastWhere = dialect.sqlToQuery(condition as Parameters<PgDialect['sqlToQuery']>[0]);
    return queryBuilder;
  });
  queryBuilder.orderBy.mockImplementation(() => queryBuilder);
  queryBuilder.limit.mockImplementation((limit: number) => {
    queryState.lastLimit = limit;
    return Promise.resolve(applyQuery(queryState.rows as Listing[], queryState.lastWhere, limit));
  });

  const mockDb = {
    select: vi.fn(() => queryBuilder),
  };

  return { queryState, queryBuilder, mockDb };
});

vi.mock('@/lib/db', async () => {
  const schema = await import('@/lib/db/schema');
  return { db: mockDb, schema };
});

import { GET } from '@/app/api/listings/route';

function request(path = '/api/listings') {
  return new NextRequest(`http://localhost${path}`);
}

async function responseListingIds(path?: string) {
  const response = await GET(request(path));
  const payload = (await response.json()) as ListingFeatureCollection;

  return {
    response,
    ids: payload.features.map((feature) => feature.properties.id),
  };
}

describe('GET /api/listings', () => {
  beforeEach(() => {
    queryState.rows = [
      createListing({
        id: 'active-mo-owner-finance',
        state: 'Missouri',
        score: 92,
        price: 9000,
        acres: 10,
        owner_financing: true,
        hoa_risk: 'low',
        latitude: 37.4,
        longitude: -91.1,
      }),
      createListing({
        id: 'active-wi',
        state: 'Wisconsin',
        score: 85,
        price: 14000,
        acres: 12,
        owner_financing: false,
        hoa_risk: 'unknown',
        latitude: 44.9,
        longitude: -89.7,
      }),
      createListing({
        id: 'active-mo-high-hoa',
        state: 'Missouri',
        score: 70,
        price: 11000,
        acres: 8,
        owner_financing: false,
        hoa_risk: 'high',
        latitude: 36.4,
        longitude: -92.8,
      }),
      createListing({
        id: 'inactive',
        score: 99,
        status: 'inactive',
        is_duplicate: false,
      }),
      createListing({
        id: 'duplicate',
        score: 98,
        status: 'active',
        is_duplicate: true,
      }),
    ];
    queryState.lastWhere = null;
    queryState.lastLimit = null;
    mockDb.select.mockClear();
    queryBuilder.from.mockClear();
    queryBuilder.where.mockClear();
    queryBuilder.orderBy.mockClear();
    queryBuilder.limit.mockClear();
  });

  it('returns all active non-duplicate listings by default', async () => {
    const { ids } = await responseListingIds();

    expect(ids).toEqual(['active-mo-owner-finance', 'active-wi', 'active-mo-high-hoa']);
    expect(queryState.lastWhere?.sql).toContain('"listings"."status" = $1');
    expect(queryState.lastWhere?.sql).toContain('"listings"."is_duplicate" = $2');
    expect(queryState.lastLimit).toBe(1200);
  });

  it('applies the minimum score filter', async () => {
    const { ids } = await responseListingIds('/api/listings?min_score=80');

    expect(ids).toEqual(['active-mo-owner-finance', 'active-wi']);
    expect(queryState.lastWhere?.sql).toContain('"listings"."score" >= $3');
    expect(queryState.lastWhere?.params[2]).toBe(80);
  });

  it('applies the state filter', async () => {
    const { ids } = await responseListingIds('/api/listings?state=Missouri');

    expect(ids).toEqual(['active-mo-owner-finance', 'active-mo-high-hoa']);
    expect(queryState.lastWhere?.sql).toContain('"listings"."state" = $6');
    expect(queryState.lastWhere?.params[5]).toBe('Missouri');
  });

  it('applies the owner financing filter', async () => {
    const { ids } = await responseListingIds('/api/listings?owner_finance=true');

    expect(ids).toEqual(['active-mo-owner-finance']);
    expect(queryState.lastWhere?.sql).toContain('"listings"."owner_financing" = $6');
    expect(queryState.lastWhere?.params[5]).toBe(true);
  });

  it('filters out high HOA risk listings when no_hoa is true', async () => {
    const { ids } = await responseListingIds('/api/listings?no_hoa=true');

    expect(ids).toEqual(['active-mo-owner-finance', 'active-wi']);
    expect(queryState.lastWhere?.sql).toContain('"listings"."hoa_risk" is null');
    expect(extractHoaRiskParams(queryState.lastWhere)).toEqual(['unknown', 'none', 'low']);
  });

  it('falls back to defaults for invalid numeric params instead of throwing', async () => {
    const { response, ids } = await responseListingIds(
      '/api/listings?min_score=nope&max_price=bad&min_acres=wrong',
    );

    expect(response.status).toBe(200);
    expect(ids).toEqual(['active-mo-owner-finance', 'active-wi', 'active-mo-high-hoa']);
    expect(queryState.lastWhere?.params.slice(0, 5)).toEqual(['active', false, 0, '35000', '1']);
  });

  it('filters listings to the current bbox when provided', async () => {
    queryState.rows.push(
      createListing({
        id: 'active-no-coords',
        score: 88,
        latitude: null,
        longitude: null,
      }),
    );

    const { ids } = await responseListingIds('/api/listings?bbox=-91.5,37,-90.5,38');

    expect(ids).toEqual(['active-mo-owner-finance']);
    expect(queryState.lastWhere?.sql).toContain('"listings"."longitude" is not null');
    expect(queryState.lastWhere?.sql).toContain('"listings"."latitude" is not null');
    expect(queryState.lastWhere?.sql).toContain('"listings"."longitude" >= ');
    expect(queryState.lastWhere?.sql).toContain('"listings"."longitude" <= ');
    expect(queryState.lastWhere?.sql).toContain('"listings"."latitude" >= ');
    expect(queryState.lastWhere?.sql).toContain('"listings"."latitude" <= ');
    expect(
      extractParams(queryState.lastWhere, /"listings"\."longitude" [<>]= \$(\d+)/g).map(Number),
    ).toEqual([-91.5, -90.5]);
    expect(extractParams(queryState.lastWhere, /"listings"\."latitude" [<>]= \$(\d+)/g).map(Number)).toEqual([
      37,
      38,
    ]);
  });
});
