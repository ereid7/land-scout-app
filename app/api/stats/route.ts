import { NextResponse } from 'next/server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        total: 0,
        avgScore: 0,
        byState: {},
        lastRun: null,
        newToday: 0,
        lastRunStatus: null,
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=30' },
      },
    );
  }

  const supabase = createClient();

  const byStateResult = await supabase
    .from('listings')
    .select('state')
    .eq('status', 'active')
    .eq('is_duplicate', false);

  const totalsResult = await supabase
    .from('listings')
    .select('score')
    .eq('status', 'active')
    .eq('is_duplicate', false);

  const lastRunResult = await supabase
    .from('scout_runs')
    .select('started_at, listings_new, status')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: byState, error: byStateError } = byStateResult;
  const { data: totals, error: totalsError } = totalsResult;
  const { data: lastRun, error: lastRunError } = lastRunResult;

  const firstError = byStateError ?? totalsError ?? lastRunError;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const stateRows = (byState ?? []) as Array<{ state: string | null }>;
  const scoreRows = (totals ?? []) as Array<{ score: number | null }>;
  const latestRun = (lastRun ?? null) as {
    started_at: string | null;
    listings_new: number | null;
    status: 'running' | 'complete' | 'error' | null;
  } | null;

  const stateCounts: Record<string, number> = {};
  for (const row of stateRows) {
    if (row.state) {
      stateCounts[row.state] = (stateCounts[row.state] ?? 0) + 1;
    }
  }

  const scores = scoreRows
    .map((row) => Number(row.score ?? 0))
    .filter((score) => Number.isFinite(score));

  const avgScore = scores.length
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
    : 0;

  return NextResponse.json(
    {
      total: scoreRows.length,
      avgScore,
      byState: stateCounts,
      lastRun: latestRun?.started_at ?? null,
      newToday: latestRun?.listings_new ?? 0,
      lastRunStatus: latestRun?.status ?? null,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=30' },
    },
  );
}
