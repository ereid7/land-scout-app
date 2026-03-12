import { and, desc, eq, gte, sql } from 'drizzle-orm';

import LandingPage, { type LandingDeal } from '@/components/LandingPage';
import { db, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getLandingData(): Promise<{
  totalCount: number;
  stateCount: number;
  topDeals: LandingDeal[];
}> {
  try {
    const activeListingsFilter = and(
      eq(schema.listings.status, 'active'),
      eq(schema.listings.is_duplicate, false),
    );

    const [countRows, stateRows, topDeals] = await Promise.all([
      db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.listings)
        .where(activeListingsFilter),
      db
        .select({
          count: sql<number>`cast(count(distinct ${schema.listings.state}) as integer)`,
        })
        .from(schema.listings)
        .where(activeListingsFilter),
      db
        .select({
          id: schema.listings.id,
          title: schema.listings.title,
          price: schema.listings.price,
          acres: schema.listings.acres,
          state: schema.listings.state,
          county: schema.listings.county,
          score: schema.listings.score,
        })
        .from(schema.listings)
        .where(and(activeListingsFilter, gte(schema.listings.score, 85)))
        .orderBy(desc(schema.listings.score))
        .limit(3),
    ]);

    return {
      totalCount: Number(countRows[0]?.count ?? 0),
      stateCount: Number(stateRows[0]?.count ?? 0),
      topDeals,
    };
  } catch (error) {
    console.error('Failed to load landing page data', error);
    return {
      totalCount: 0,
      stateCount: 19,
      topDeals: [],
    };
  }
}

export default async function HomePage() {
  const { totalCount, stateCount, topDeals } = await getLandingData();

  return <LandingPage totalCount={totalCount} stateCount={stateCount} topDeals={topDeals} />;
}
