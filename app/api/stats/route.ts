import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, schema } from '@/lib/db';
import { hasDatabaseUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasDatabaseUrl) {
    return NextResponse.json({
      total: 0,
      avgScore: 0,
      byState: {},
      lastRun: null,
      newToday: 0,
      lastRunStatus: null,
    });
  }

  const [rows, lastRun] = await Promise.all([
    db
      .select({
        state: schema.listings.state,
        score: schema.listings.score,
        first_seen: schema.listings.first_seen,
      })
      .from(schema.listings)
      .where(and(eq(schema.listings.status, 'active'), eq(schema.listings.is_duplicate, false))),
    db
      .select({
        started_at: schema.scoutRuns.started_at,
        status: schema.scoutRuns.status,
      })
      .from(schema.scoutRuns)
      .orderBy(desc(schema.scoutRuns.started_at))
      .limit(1),
  ]);

  const byState: Record<string, number> = {};
  let totalScore = 0;
  let newToday = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const row of rows) {
    if (row.state) {
      byState[row.state] = (byState[row.state] ?? 0) + 1;
    }
    totalScore += row.score ?? 0;

    if (row.first_seen) {
      const firstSeen = new Date(row.first_seen);
      if (!Number.isNaN(firstSeen.getTime()) && firstSeen >= today) {
        newToday += 1;
      }
    }
  }

  const total = rows.length;
  const avgScore = total > 0 ? Number((totalScore / total).toFixed(1)) : 0;

  return NextResponse.json({
    total,
    avgScore,
    byState,
    lastRun: lastRun[0]?.started_at ?? null,
    newToday,
    lastRunStatus: lastRun[0]?.status ?? null,
  });
}
