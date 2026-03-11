import { NextRequest, NextResponse } from 'next/server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const limit = Math.min(Math.max(Number.parseInt(req.nextUrl.searchParams.get('limit') ?? '10', 10), 1), 50);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ runs: [] }, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('scout_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { runs: data ?? [] },
    {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    },
  );
}
