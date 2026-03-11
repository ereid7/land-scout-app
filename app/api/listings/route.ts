import { and, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, schema } from '@/lib/db';
import { listingsToFeatureCollection } from '@/lib/listing-helpers';

export const dynamic = 'force-dynamic';

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const minScore = Math.max(0, Math.min(100, parseNumber(searchParams.get('min_score'), 0)));
  const maxPrice = Math.max(0, parseNumber(searchParams.get('max_price'), 35000));
  const minAcres = Math.max(0, parseNumber(searchParams.get('min_acres'), 1));
  const state = searchParams.get('state')?.trim();
  const ownerFinance = searchParams.get('owner_finance') === 'true';
  const noHoa = searchParams.get('no_hoa') === 'true';
  const motivated = searchParams.get('motivated') === 'true';

  const conditions = [
    eq(schema.listings.status, 'active'),
    eq(schema.listings.is_duplicate, false),
    gte(schema.listings.score, minScore),
    lte(schema.listings.price, maxPrice),
    gte(schema.listings.acres, minAcres),
  ];

  if (state) {
    conditions.push(eq(schema.listings.state, state));
  }

  if (ownerFinance) {
    conditions.push(eq(schema.listings.owner_financing, true));
  }

  if (noHoa) {
    conditions.push(
      or(
        isNull(schema.listings.hoa_risk),
        eq(schema.listings.hoa_risk, 'unknown'),
        eq(schema.listings.hoa_risk, 'none'),
        eq(schema.listings.hoa_risk, 'low'),
      )!,
    );
  }

  if (motivated) {
    conditions.push(eq(schema.listings.motivated_seller, true));
  }

  const rows = await db
    .select()
    .from(schema.listings)
    .where(and(...conditions))
    .orderBy(desc(schema.listings.score), schema.listings.price)
    .limit(1200);

  return NextResponse.json(listingsToFeatureCollection(rows));
}
