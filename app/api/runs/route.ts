import { desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 10;
  }
  return Math.max(1, Math.min(50, Math.trunc(parsed)));
}

export async function GET(request: NextRequest) {
  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

  const runs = await db
    .select()
    .from(schema.scoutRuns)
    .orderBy(desc(schema.scoutRuns.started_at))
    .limit(limit);

  return NextResponse.json({ runs });
}
