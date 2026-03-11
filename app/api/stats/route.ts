import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [rows, lastRun] = await Promise.all([
    db
      .select({
        state: schema.listings.state,
        score: schema.listings.score,
      })
      .from(schema.listings)
      .where(and(eq(schema.listings.status, 'active'), eq(schema.listings.is_duplicate, false))),
    db
      .select({
        started_at: schema.scoutRuns.started_at,
      })
      .from(schema.scoutRuns)
      .orderBy(desc(schema.scoutRuns.started_at))
      .limit(1),
  ]);

  const byState: Record<string, number> = {};
  let totalScore = 0;

  for (const row of rows) {
    if (row.state) {
      byState[row.state] = (byState[row.state] ?? 0) + 1;
    }
    totalScore += row.score ?? 0;
  }

  const total = rows.length;
  const avgScore = total > 0 ? Number((totalScore / total).toFixed(1)) : 0;

  return NextResponse.json({
    total,
    avgScore,
    byState,
    lastRun: lastRun[0]?.started_at ?? null,
  });
}
