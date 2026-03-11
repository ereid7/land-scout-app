import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

type HealthStatus = 'ok' | 'degraded' | 'down';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function consecutiveZeros(runs: Array<{ listings_found: number }>) {
  let count = 0;

  for (const run of runs) {
    if (run.listings_found > 0) {
      break;
    }
    count += 1;
  }

  return count;
}

function toStatus(lastRun: string | null, zeroCount: number): HealthStatus {
  if (!lastRun) {
    return 'down';
  }

  const lastRunTime = Date.parse(lastRun);
  const stale = Number.isNaN(lastRunTime) || lastRunTime < Date.now() - SEVEN_DAYS_MS;

  if (stale || zeroCount > 5) {
    return 'down';
  }

  if (zeroCount >= 3) {
    return 'degraded';
  }

  return 'ok';
}

export async function GET() {
  const [scraperRuns, scoutRuns] = await Promise.all([
    db
      .select({
        scraper_id: schema.scraperRuns.scraper_id,
        started_at: schema.scraperRuns.started_at,
        listings_found: schema.scraperRuns.listings_found,
      })
      .from(schema.scraperRuns)
      .orderBy(schema.scraperRuns.scraper_id, desc(schema.scraperRuns.started_at)),
    db
      .select({
        started_at: schema.scoutRuns.started_at,
      })
      .from(schema.scoutRuns)
      .orderBy(desc(schema.scoutRuns.started_at))
      .limit(1),
  ]);

  const runsByScraper = new Map<
    string,
    Array<{
      started_at: string | null;
      listings_found: number;
    }>
  >();

  for (const row of scraperRuns) {
    const runs = runsByScraper.get(row.scraper_id) ?? [];
    if (runs.length >= 10) {
      continue;
    }

    runs.push({
      started_at: row.started_at,
      listings_found: row.listings_found,
    });
    runsByScraper.set(row.scraper_id, runs);
  }

  const scrapers = Array.from(runsByScraper.entries())
    .map(([id, runs]) => {
      const latestRun = runs[0];
      const zeroCount = consecutiveZeros(runs);

      return {
        id,
        last_run: latestRun?.started_at ?? null,
        last_found: latestRun?.listings_found ?? null,
        consecutive_zeros: zeroCount,
        status: toStatus(latestRun?.started_at ?? null, zeroCount),
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  return NextResponse.json({
    scrapers,
    last_scout_run: scoutRuns[0]?.started_at ?? null,
  });
}
